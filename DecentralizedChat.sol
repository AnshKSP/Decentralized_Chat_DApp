// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedChat {
    struct Message {
        address sender;
        address receiver;
        string content;
        uint256 timestamp;
    }
    
    Message[] public messages;
    
    event NewMessage(address indexed from, address indexed to, string message, uint256 timestamp);
    
    // Send a message
    function sendMessage(address _to, string memory _content) public {
        messages.push(Message(msg.sender, _to, _content, block.timestamp));
        emit NewMessage(msg.sender, _to, _content, block.timestamp);
    }
    
    // Read all messages sent to a user
    function readMessages(address _user) public view returns (Message[] memory) {
        uint count = 0;
        for (uint i = 0; i < messages.length; i++) {
            if (messages[i].receiver == _user) {
                count++;
            }
        }
        Message[] memory result = new Message[](count);
        uint j = 0;
        for (uint i = 0; i < messages.length; i++) {
            if (messages[i].receiver == _user) {
                result[j] = messages[i];
                j++;
            }
        }
        return result;
    }
}
