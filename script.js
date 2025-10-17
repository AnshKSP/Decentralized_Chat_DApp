// Place all the contract ABI and address for your deployed contract:
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,"internalType": "address","name": "from","type": "address"},
      {"indexed": true,"internalType": "address","name": "to","type": "address"},
      {"indexed": false,"internalType": "string","name": "message","type": "string"},
      {"indexed": false,"internalType": "uint256","name": "timestamp","type": "uint256"}
    ],
    "name": "NewMessage",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "address","name": "_to","type": "address"},
      {"internalType": "string","name": "_content","type": "string"}
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256","name": "","type": "uint256"}
    ],
    "name": "messages",
    "outputs": [
      {"internalType": "address","name": "sender","type": "address"},
      {"internalType": "address","name": "receiver","type": "address"},
      {"internalType": "string","name": "content","type": "string"},
      {"internalType": "uint256","name": "timestamp","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address","name": "_user","type": "address"}
    ],
    "name": "readMessages",
    "outputs": [
      {"components": [
        {"internalType": "address","name": "sender","type": "address"},
        {"internalType": "address","name": "receiver","type": "address"},
        {"internalType": "string","name": "content","type": "string"},
        {"internalType": "uint256","name": "timestamp","type": "uint256"}
      ],
      "internalType": "struct DecentralizedChat.Message[]",
      "name": "",
      "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
const contractAddress = "0x826939BeB7C24C1069009c1B916b7de356b6de1a";

// ------------------------ DAPP LOGIC ------------------------
let userAccount = "";
let web3, contract;
let refreshInterval;
const contacts = [
  { address: "0x9a3D792B649cb11B23c98D8cF56E2BB6a1064207", name: "Ansh" },
  { address: "0x745e5C7baa73C5f546072777d40725bD877c0eB7", name: "Aditya" }
];
const nameDict = {
  "0x9a3D792B649cb11B23c98D8cF56E2BB6a1064207": "Ansh",
  "0x745e5C7baa73C5f546072777d40725bD877c0eB7": "Aditya"
};
const chatForm = document.getElementById('chatForm');
const messagesDiv = document.getElementById('messages');
let lastMessageIds = new Set();

function populateRecipientDropdown() {
  const select = document.getElementById('receiverAddress');
  select.innerHTML = "";
  contacts.forEach(contact => {
    if (contact.address.toLowerCase() !== userAccount.toLowerCase()) {
      const option = document.createElement('option');
      option.value = contact.address;
      option.textContent = `${contact.name} (${contact.address.slice(0,6)}...${contact.address.slice(-4)})`;
      select.appendChild(option);
    }
  });
}

document.getElementById('connectBtn').onclick = async function() {
  if (typeof window.ethereum !== "undefined") {
    web3 = new window.Web3(window.ethereum);
    contract = new web3.eth.Contract(contractABI, contractAddress);
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAccount = accounts[0];
    document.getElementById("connectionStatus").textContent = "Connected: " + userAccount;
    populateRecipientDropdown();
    lastMessageIds.clear();
    messagesDiv.innerHTML = "";
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(autoReadMessages, 1000);
  } else {
    document.getElementById("connectionStatus").textContent = "MetaMask not installed!";
  }
};

function getInitials(name, address) {
  if (name) return name[0].toUpperCase();
  return address ? address.slice(2, 3).toUpperCase() : "?";
}
function getAvatarColor(name) {
  const colors = ["#868ff7", "#c04aff", "#6a80f7", "#ffbe95", "#7a5fff", "#ff80bf"];
  let sum = 0;
  for (let i=0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
}
function statusTicks(isReceived) {
  return isReceived ? '<span class="ticks">&#10003;&#10003;</span>' : '<span class="ticks">&#10003;</span>';
}

chatForm.addEventListener('submit', async function(e){
  e.preventDefault();
  const receiver = document.getElementById('receiverAddress').value;
  const msg = document.getElementById('message').value.trim();
  if (receiver && msg && userAccount && contract) {
    try {
      await contract.methods.sendMessage(receiver, msg).send({ from: userAccount });
      addMessage(userAccount, receiver, msg, null, false);
      const identifier = [userAccount, receiver, Math.floor(Date.now() / 1000)].join('_');
      lastMessageIds.add(identifier);
      chatForm.reset();
    } catch (err) {
      alert("Send failed: " + err.message);
    }
  }
});

function addMessage(sender, receiver, text, timestamp, isReceived) {
  let mine = sender && userAccount && (sender.toLowerCase() === userAccount.toLowerCase());
  if (typeof isReceived === "undefined") {
    isReceived = receiver && userAccount && (receiver.toLowerCase() === userAccount.toLowerCase());
  }
  let recLabel = nameDict[receiver] ? `${nameDict[receiver]} (${receiver.slice(0,6)}…${receiver.slice(-4)})` : receiver;
  let showName = nameDict[sender] ? nameDict[sender] : (sender ? sender.slice(0,6)+'…'+sender.slice(-4) : "?");
  let initials = getInitials(showName, sender);
  let avatarColor = getAvatarColor(showName);
  const div = document.createElement('div');
  div.className = "message" + (mine ? " mine" : "");
  div.innerHTML =
    (!mine ? `<div class="avatar" style="background:${avatarColor};">${initials}</div>` : "") +
    `<strong>${showName}</strong> <span style="font-size:0.96em;color:#8360c3;">to <b>${recLabel}</b></span><br>${text}` +
    statusTicks(isReceived) +
    (timestamp ? `<br><span style="color:#aaa;font-size:0.8em;">${timestamp}</span>` : "");
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function autoReadMessages() {
  if (!contract || !userAccount) return;
  try {
    const allMessages = await contract.methods.readMessages(userAccount).call({ from: userAccount });
    allMessages.forEach(msg => {
      const identifier = [msg.sender, msg.receiver, msg.timestamp].join('_');
      if (!lastMessageIds.has(identifier)) {
        const date = new Date(msg.timestamp * 1000).toLocaleString();
        addMessage(msg.sender, msg.receiver, msg.content, date, true);
        lastMessageIds.add(identifier);
      }
    });
  } catch (err) {
    messagesDiv.innerHTML = "<div>Error reading messages<br>" + err.message + "</div>";
  }
}

// --- Emoji Picker ---
document.addEventListener("DOMContentLoaded", function() {
  const emojiBtn = document.getElementById('emojiBtn');
  const emojiPopup = document.getElementById('emojiPopup');
  const emojiSearch = document.getElementById('emojiSearch');
  const emojiListContainer = emojiPopup.querySelector('.emoji-list');
  const advancedEmojis = [
    "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😍","😋","😎","😐","😒","😔","😕","😢","😭","😲","😱","😏","😩","😤","😠","😏","😯","😲","😭","😡","👍",
    "👌","🙏","👏","💪","💡","🎉","🔥","❤️","💜","🧡","🤍","🤎","💚","💙","💛","💯","⭐","🌟","✨","🤖","👽","👻","🎶","👀","😇","😉","🙂","🥰","🥺","😘","😜",
    "🥳","😎","😡","😢","😳","😱","😫","🤯","🥱","😴","🙏","👋","🤝","✌️","🤗","🙃","🙌","🤔","🤩","😷","🤒","🥶","😨","🥴","🤑","🚀","🏆","⚡",
    "🤠","🥺","👑","😻","😽","🙈","🙉","🙊","👾","🎨","🍕","🍔","🌭","🌮","🍣","🍩","🍪","🍰","🥨","🍦","🍉","🍓","🥑","🍍","🏀","⚽","🎾","🎵","🎬","🪐","🎮",
    "🤖","🌈","🌞","🌧️","☁️","🌪️","⛈️","🌩️","🌥️","⛅"
  ];
  function renderEmojis(filter="") {
    emojiListContainer.innerHTML = "";
    let shown = 0;
    advancedEmojis.forEach(e => {
      if (!filter || e.includes(filter)) {
        const s = document.createElement('span'); s.textContent = e;
        s.onclick = function() {
          const textarea = document.getElementById('message');
          const start = textarea.selectionStart, end = textarea.selectionEnd;
          textarea.value = textarea.value.slice(0, start) + e + textarea.value.slice(end);
          textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + e.length;
          emojiPopup.style.display = 'none';
        };
        emojiListContainer.appendChild(s);
        shown++;
      }
    });
    if (!shown) emojiListContainer.innerHTML = "<span style='opacity:.7;font-size:.9em;'>No emoji found</span>";
  }
  renderEmojis();
  emojiBtn.onclick = function(e){
    emojiPopup.style.display = emojiPopup.style.display === 'block' ? 'none' : 'block';
    emojiSearch.value = "";
    renderEmojis();
    setTimeout(()=>emojiSearch.focus(), 120);
  };
  emojiSearch.oninput = function() {
    renderEmojis(this.value.trim());
  };
  emojiPopup.onblur = () => { emojiPopup.style.display = 'none'; };
  document.body.onclick = function(e){
    if (!emojiPopup.contains(e.target) && e.target!==emojiBtn) emojiPopup.style.display='none';
  };
});
