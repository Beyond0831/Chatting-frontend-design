import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, apiCallPost, apiCallGet, apiCallPut, apiCallDelete} from './helpers.js';

console.log('Let\'s go!');

const showPage = (pageName) => {
    for (const page of document.querySelectorAll('.page-block')) {
        page.style.display = 'none';
    }

    document.getElementById(`${pageName}-page`).style.display = 'block';
    
    if(pageName === 'main') {
        document.dispatchEvent(showChannelLists);
    }

    if (pageName !== 'login' && pageName !== 'register') {
        console.log(document.getElementById('log-out-button'));
        document.getElementById('log-out-button').style.display = 'block';
    } else {
        document.getElementById('log-out-button').style.display = 'none';
    }
}

const closeCreateChannelForm = () => {
    for (const data of document.querySelectorAll('.create-channel-form')) {
        data.style.display = 'none';
    }
}

// display channel list buttons
const appendChannelInfo = (element, channelInfo) => {
    if (document.getElementById(channelInfo.id)) return;
    
    const newDiv = document.createElement('div');
    newDiv.setAttribute('id', `div-${channelInfo.id}`);
    newDiv.classList.add('channel');

    const publicChannelButton = document.createElement('button');
    publicChannelButton.setAttribute('id', channelInfo.id);
    publicChannelButton.setAttribute('class', 'channel-button');
    publicChannelButton.textContent = channelInfo.name;
    publicChannelButton.classList.add('channel-button');
    newDiv.appendChild(publicChannelButton);


    const modalChannelSelect = document.getElementById('modal-channel-select');
    const option = document.createElement('option');
    option.value = channelInfo.id;
    option.textContent = channelInfo.name;
    modalChannelSelect.append(option);


    const joinButton = document.createElement('button');
    joinButton.textContent = 'join this channel';
    joinButton.classList.add('join-button');
    joinButton.addEventListener('click', ()=> {
        apiCallPost(`channel/${channelInfo.id}/join`, {}, true, globalToken)
        .then((result)=> {
            console.log(result);
            joinButton.style.display = 'none';
            leaveButton.style.display = 'block';
            option.style.display = 'block';
        })
        .catch((error)=> {
            alert(error);
            console.log(error);
        })
    })
    newDiv.appendChild(joinButton);

    const leaveButton = document.createElement('button');
    leaveButton.textContent = 'leave this channel';
    leaveButton.classList.add('leave-button');
    leaveButton.addEventListener('click', ()=> {
        apiCallPost(`channel/${channelInfo.id}/leave`, {}, true, globalToken)
        .then((result)=> {
            leaveButton.style.display = 'none';

            if (channelInfo.private) {
                const channelEnterButton = document.getElementById(channelInfo.id);
                channelEnterButton.style.display = 'none';
                option.style.display = 'none';
            } else {
                joinButton.style.display = 'block';
                option.style.display = 'none';
            }
        })
        .catch((error)=> {
            alert(error);
            console.log(error);
        })
    })

    newDiv.appendChild(leaveButton);

    element.appendChild(newDiv);

    if(channelInfo.members.includes(globalUserID) === false) {
        leaveButton.style.display = 'none';
        option.style.display = 'none';
    
    } else {
        joinButton.style.display = 'none';
        option.style.display = 'block';
    }


}

const generateEditChannelButton = (channelId)=> {
    // submit form
    const editForm = document.createElement('form');
    const newName = document.createTextNode("New Channel Name: ");
    const nameInput = document.createElement('input');
    nameInput.setAttribute('type', 'text');
    // nameInput.setAttribute('name', 'name');

    const newDescription = document.createTextNode("New Description: ");
    const descriptionInput = document.createElement('input');
    descriptionInput.setAttribute('type', 'text');
    // descriptionInput.setAttribute('name', 'description');

    const editSubmitButton = document.createElement('button');
    editSubmitButton.setAttribute('type', 'button');
    editSubmitButton.textContent = 'update channel\'s info';
    editSubmitButton.addEventListener('click', ()=> {
        const newNameValue = nameInput.value;
        const newDescriptionValue = descriptionInput.value;

        apiCallPut(`channel/${channelId}`, {
            name: newNameValue,
            description: newDescriptionValue,
        }, true, globalToken)
        .then((result)=> {
            alert('the information of the channel has been updated');

            const currentEditedPage = document.getElementById(`${channelId}-page`);
            const title = currentEditedPage.querySelector('h3');
            title.textContent = newNameValue;
            const descriptionInfo = currentEditedPage.querySelector(`#description-${channelId}`);
            console.log(descriptionInfo);
            descriptionInfo.textContent = newDescriptionValue;

            editForm.style.display = 'none';
        })
        .catch((error)=> {
            alert(error);
            console.log(error);
        })
    })

    const closeFormButton = document.createElement('button');
    closeFormButton.setAttribute('type', 'button');
    closeFormButton.textContent = 'close the edit form';
    closeFormButton.addEventListener('click', ()=> {
        editForm.style.display = 'none';
    })

    editForm.appendChild(newName);
    editForm.appendChild(nameInput);
    editForm.appendChild(document.createElement('br'));
    editForm.appendChild(newDescription);
    editForm.appendChild(descriptionInput);
    editForm.appendChild(document.createElement('br'));
    editForm.appendChild(editSubmitButton);
    editForm.appendChild(closeFormButton);
    editForm.style.display = 'none';
    return editForm;
}

// work only if the message id is within the latest 25 messages
// get the sender's latest message
const fetchMessageWithSenderId = (senderId, channelId, currentChannelPage) => {
    apiCallGet(`message/${channelId}`, globalToken, 0)
    .then((result) => {
        console.log(result);

        let messageContainer = currentChannelPage.querySelector('.messages-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.classList.add('messages-container');
            currentChannelPage.appendChild(messageContainer);
        }

        const matchedMessage = result.messages.find(message => message.sender === senderId);

        if (matchedMessage) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.setAttribute('id', `message-${matchedMessage.id}`)

            const senderInfo = document.createElement('div');
            senderInfo.classList.add('sender-info');

            const senderName = document.createElement('span');
            senderName.classList.add('sender-name');
            apiCallGet(`user/${matchedMessage.sender}`, globalToken)
            .then((senderInfo) => {
                senderName.textContent = `Sender: ${senderInfo.name}`;
            })
            .catch((error) => {
                alert(error);
                console.error(error);
            });
            senderInfo.appendChild(senderName);

            const profilePhoto = document.createElement('img');
            profilePhoto.classList.add('profile-photo');
            profilePhoto.src = matchedMessage.image || '../download.jpg';
            senderInfo.appendChild(profilePhoto);

            messageDiv.appendChild(senderInfo);

            const messageText = document.createElement('p');
            messageText.textContent = matchedMessage.message;
            messageText.classList.add('message-text');
            messageDiv.appendChild(messageText);

            const timestamp = new Date(matchedMessage.sentAt);
            const formattedDate = generateFormattedTime(timestamp);
            const messageTimestamp = document.createElement('span');
            messageTimestamp.textContent = formattedDate;
            messageTimestamp.classList.add('message-time');
            messageDiv.appendChild(messageTimestamp);

            generateReactionButtons(messageDiv, channelId, matchedMessage.id);
            generatePinButton(messageDiv, channelId, matchedMessage.id, matchedMessage.pinned);
            generateDeleteMessageButton(messageDiv, channelId, matchedMessage.id);
            generateEditMessageButton(messageDiv, channelId, matchedMessage.id);

            messageContainer.appendChild(messageDiv);
        }
    })
    .catch((error) => {
        alert(error);
        console.error(error);
    });
}


const fetchMessageWithMessageId = (messageId) => {
    const messageDiv = document.getElementById(`message-${messageId}`);
    return messageDiv;
}

const generateReactionButtons = (messageDiv, channelId, messageId, existingReactions=null) => {
    const reactions = ['👍', '❤️', '😂']; 

    console.log(existingReactions);

    const reactionsContainer = document.createElement('div');
    reactionsContainer.classList.add('reactions-container');

    reactions.forEach((reaction) => {
        const reactionButton = document.createElement('button');
        reactionButton.textContent = reaction;
        reactionButton.classList.add('reaction-button');

        const reactionCount = existingReactions ? existingReactions.filter(r => r.react === reaction).length : 0;
        reactionButton.textContent = `${reaction} ${reactionCount}`;

        let hasReacted = existingReactions && existingReactions.some(r => r.react === reaction && r.user === globalUserID);
        


        reactionButton.addEventListener('click', () => {
            if (hasReacted) {
                apiCallPost(`message/unreact/${channelId}/${messageId}`, {
                    react: reaction,
                }, true, globalToken)
                .then((result) => {
                    const newCount = reactionCount;
                    reactionButton.textContent = `${reaction} ${newCount}`;
                    hasReacted = false;

                })
                .catch((error) => {
                    alert(error);
                    console.error(error);
                });
            } else {
                apiCallPost(`message/react/${channelId}/${messageId}`, {
                    react: reaction,
                }, true, globalToken)
                .then((result) => {
                    const newCount = reactionCount + 1;
                    reactionButton.textContent = `${reaction} ${newCount}`;
                    hasReacted = true;

                })
                .catch((error) => {
                    alert(error);
                    console.error(error);
                });
            }
        
        });

        reactionsContainer.appendChild(reactionButton);
    });

    messageDiv.appendChild(reactionsContainer);
}


const updatePinButtonText = (button, isPinned) => {
    button.textContent = isPinned ? 'Unpin' : 'Pin';
}

const generatePinButton = (messageDiv, channelId, messageId, isPinned) => {
    const pinButton = document.createElement('button');
    pinButton.classList.add('reaction-button');
    updatePinButtonText(pinButton, isPinned);

    pinButton.addEventListener('click', () => {
        const action = isPinned ? 'unpin' : 'pin';
        apiCallPost(`message/${action}/${channelId}/${messageId}`, {}, true, globalToken)
        .then((result) => {
            isPinned = !isPinned;
            updatePinButtonText(pinButton, isPinned);

            if (isPinned) {
                messageDiv.classList.add('pinned');
            } else {
                messageDiv.classList.remove('pinned');
            }
            const messageContainer = messageDiv.closest('.messages-container');
            reorderMessages(messageContainer);
        })
        .catch((error) => {
            alert(error);
            console.error(error);
        });
    });

    messageDiv.appendChild(pinButton);
}


const convertToISOFormat = (timeSent) => {
    const [datePart, timePart] = timeSent.split(' ');
    const [day, month, year] = datePart.split('-');
    return `${year}-${month}-${day}T${timePart}`;
}

const reorderMessages = (messageContainer) => {
    let messages = Array.from(messageContainer.children).sort((a, b) => {
        const isPinnedA = a.classList.contains('pinned');
        const isPinnedB = b.classList.contains('pinned');
        if (isPinnedA === isPinnedB) {
            const timeA = a.querySelector('.message-time').textContent;
            const timeB = b.querySelector('.message-time').textContent;

            const dateA = new Date(convertToISOFormat(timeA));
            const dateB = new Date(convertToISOFormat(timeB));
            const value = dateA - dateB;

            return value;
        }

        return isPinnedB - isPinnedA;
    });


    console.log(messages);
    messages.forEach(messageDiv => {
        messageContainer.appendChild(messageDiv); 
    });
}


const generateFormattedTime = (timestamp) => {
    return `${timestamp.getDate()}-${timestamp.getMonth() + 1}-${timestamp.getFullYear()} ${timestamp.getHours() < 10 ? '0' : ''}${timestamp.getHours()}:${timestamp.getMinutes() < 10 ? '0' : ''}${timestamp.getMinutes()}:${timestamp.getSeconds() < 10 ? '0' : ''}${timestamp.getSeconds()}`;
}


const generateEditMessageButton = (messageDiv, channelId, messageId) => {
    const editButton = document.createElement('button');
    editButton.textContent = 'edit this message';
    editButton.classList.add('edit-button');
    messageDiv.appendChild(editButton);

    editButton.addEventListener('click', ()=> {
        const editForm = document.createElement('form');

        const editInput = document.createElement('input');
        editInput.setAttribute('placeholder', 'edit this message');
        editForm.appendChild(editInput);

        const editCheckButton = document.createElement('button');
        editCheckButton.textContent = 'Confirm';
        editCheckButton.setAttribute('type', 'button');
        
//get user image
        let imgLink = '../download.jpg';
        apiCallGet(`user/${globalUserID}`,globalToken)
        .then((userInfo) => {
            if (userInfo.image) {
                imgLink = userInfo.image;
            } else {
                imgLink = '../download.jpg';
            }
        })
        .catch((error) => {
            alert(error);
            console.error(error);
        });
//


        editCheckButton.addEventListener('click', ()=> {
            apiCallPut(`message/${channelId}/${messageId}`, {
                message: editInput.value,
                image: imgLink,
            }, true, globalToken)

            .then((result)=> {
                alert('the message is successfully updated');
                editForm.style.display = 'none';
                const messageDiv = fetchMessageWithMessageId(messageId);
                const messageText = messageDiv.querySelector('.message-text');
                messageText.textContent = editInput.value;
                const messageTime = messageDiv.querySelector('.message-time');
                const currentTime = new Date();
                const formattedDate = generateFormattedTime(currentTime);
                messageTime.textContent = formattedDate;

            })
            .catch((error)=> {
                alert(error);
                console.log(error);
            })
        })

        editForm.appendChild(editCheckButton);

        editButton.insertAdjacentElement('afterend', editForm);
    })
}



const generateDeleteMessageButton = (messageDiv, channelId, messageId) => {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete this message';
    deleteButton.classList.add('close-button');
    messageDiv.appendChild(deleteButton);

    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this message?')) {
            apiCallDelete(`message/${channelId}/${messageId}`, {}, true, globalToken)
            .then((result) => {
                alert('The message has been successfully deleted');
                const messageDiv = fetchMessageWithMessageId(messageId);
                messageDiv.remove();
            })

            .catch((error) => {
                alert(error);
                console.error(error);
            });
        }
    });
}

const generateProfilePage = (userInfo, userId, channelId) => {

    const profilePage = document.createElement('div');
    profilePage.setAttribute('id', `profile-${userId}-page`);
    profilePage.classList.add('page-block');
    document.querySelector('main').appendChild(profilePage);

    const profilePhoto = document.createElement('img');
    profilePhoto.src = userInfo.image || '../download.jpg';
    profilePhoto.classList.add('profile-photo');
    profilePage.appendChild(profilePhoto);

    const name = document.createElement('h2');
    name.textContent = userInfo.name;
    profilePage.appendChild(name);

    const bio = document.createElement('p');
    bio.textContent = userInfo.bio || 'No bio available';
    profilePage.appendChild(bio);

    const email = document.createElement('p');
    email.textContent = userInfo.email;
    profilePage.appendChild(email);


    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
        profilePage.remove();
        showPage(`channel${channelId}`);
    });

    profilePage.appendChild(closeButton);

    
    showPage(`profile-${userId}`);
}


const generateChannelMessages = (channelId, currentChannelPage) =>{
    apiCallGet(`message/${channelId}`,globalToken, 0)
    .then((result) => {

        console.log(result);

        let messageContainer = currentChannelPage.querySelector('.messages-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.classList.add('messages-container');
            currentChannelPage.appendChild(messageContainer);
        }

        const reversedMessages = result.messages.reverse();

        reversedMessages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.setAttribute('id', `message-${message.id}`);
        
            const senderInfo = document.createElement('div');
            senderInfo.classList.add('sender-info');
        
            const senderName = document.createElement('span');
            senderName.classList.add('sender-name');
        
            apiCallGet(`user/${message.sender}`, globalToken)
                .then((senderInfo) => {
                    senderName.textContent = `Sender: ${senderInfo.name}`;
                    senderName.addEventListener('click', () => {
                        generateProfilePage(senderInfo, message.sender, channelId);
                    });
                })
                .catch((error) => {
                    alert(error);
                    console.error(error);
                });
            senderInfo.appendChild(senderName);
        
            const profilePhoto = document.createElement('img');
            profilePhoto.src = message.image || '../download.jpg';
            profilePhoto.classList.add('profile-photo');
            senderInfo.appendChild(profilePhoto);
        
            messageDiv.appendChild(senderInfo);
        
            const messageText = document.createElement('p');
            messageText.textContent = message.message;
            messageText.classList.add('message-text');
            messageDiv.appendChild(messageText);
        
            const timestamp = new Date(message.sentAt);
            const formattedDate = generateFormattedTime(timestamp);
            const messageTimestamp = document.createElement('span');
            messageTimestamp.textContent = formattedDate;
            messageTimestamp.classList.add('message-time');
            messageDiv.appendChild(messageTimestamp);
        
            generateReactionButtons(messageDiv, channelId, message.id, message.reacts);
            generatePinButton(messageDiv, channelId, message.id, message.pinned);
            if (message.sender === globalUserID) {
                generateEditMessageButton(messageDiv, channelId, message.id);
                generateDeleteMessageButton(messageDiv, channelId, message.id);
            }
            messageContainer.appendChild(messageDiv);
        });


    })
    .catch((error) => {
        alert(error);
        console.error(error);
    });
}

const generateSendMessageBlock = (channelId, currentChannelPage) => {
    const sendDiv = document.createElement('div');
    const sendInput = document.createElement('textarea');
    sendInput.classList.add('message-input');
    sendInput.setAttribute('placeholder', 'Send a message');

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.classList.add('send-button');
    sendButton.addEventListener('click', ()=> {
        const message = sendInput.value;
        const image = document.createElement('img');
        image.src = '../download.jpg';

        if (message == {}) {
            alert('you should not send only whitespace'); 

        } else {
            apiCallGet(`user/${globalUserID}`,globalToken)
            .then((userInfo) => {
                if (userInfo.image) {
                    image.src = userInfo.image;
                } else {
                    image.src = '../download.jpg';
                }
            })
            .catch((error) => {
                alert(error);
                console.error(error);
            });
    
            apiCallPost(`message/${channelId}`,{
                message: message,
                image: image.src,
            }, true, globalToken)
            .then((result) => {
                fetchMessageWithSenderId(globalUserID, channelId, currentChannelPage);
                sendInput.value ='';
            })
            .catch((error) => {
                alert(error);
                console.error(error);
            });
        }
        
    })

    sendDiv.appendChild(sendInput);
    sendDiv.appendChild(sendButton);
    currentChannelPage.appendChild(sendDiv);
}


// after clicking channel button, get the channel information
const getIntoChannel = (result, channelButton) => {
    const memberList = result.members;
    const channelId = channelButton.getAttribute('id');

    const newPageDiv = document.createElement('div');
    newPageDiv.setAttribute('id', `channel${channelId}-page`);
    newPageDiv.classList.add('page-block', 'channel-page');
    document.querySelector('main').appendChild(newPageDiv);

    
    let currentChannelPage = document.getElementById(`${channelId}-page`);
    if(!currentChannelPage) {
        currentChannelPage = document.createElement('div');
    currentChannelPage.classList.add('joined');

    const creator = document.createElement('p');
    apiCallGet(`user/${result.creator}`,globalToken)
    .then((createrInfo) => {
        creator.textContent = `Creator: ${createrInfo.name}`;
    })
    .catch((error) => {
        alert(error);
        console.error(error);
    });

    const title = document.createElement('h3');
    title.textContent = result.name;
    title.classList.add('channel-title');
    currentChannelPage.appendChild(title);

    const pInfoContainer = document.createElement('div'); 
    pInfoContainer.classList.add('p-info-container'); 
    
    const description = document.createElement('p');
    description.setAttribute('id', `description-${channelId}`);
    description.textContent = `Description: ${result.description}`;
    pInfoContainer.appendChild(description);
    
    const privacy = document.createElement('p');
    privacy.textContent = `Public/Private: ${result.private ? 'Private' : 'Public'}`;
    pInfoContainer.appendChild(privacy);
    
    const date = new Date(result.createdAt);
    const formattedDate = generateFormattedTime(date);
    
    const createdAt = document.createElement('p');
    createdAt.textContent = `Created At: ${formattedDate}`;
    pInfoContainer.appendChild(createdAt);
    
    pInfoContainer.appendChild(creator);
    
    currentChannelPage.appendChild(pInfoContainer);

    const editButton = document.createElement('button');
    editButton.textContent = 'edit channel information';
    editButton.classList.add('edit-button');
    currentChannelPage.appendChild(editButton);

    const editForm = generateEditChannelButton(channelId);

    editButton.addEventListener('click', ()=> {
        if(memberList.includes(globalUserID)) {
            editForm.style.display = 'block';
        } else {
            alert('you can not modify this channel as you are not a member of it.');
        }
    })

    const closeButton = document.createElement('button');
    closeButton.textContent = 'close the channel page';
    closeButton.classList.add('close-button');
    currentChannelPage.appendChild(closeButton);

    closeButton.addEventListener('click', ()=> {
        // currentChannelPage.style.display = 'none';
        showPage('main');
    })

    newPageDiv.appendChild(currentChannelPage);
    editButton.insertAdjacentElement('afterend', editForm);
    // newPageDiv.appendChild(editForm);

    generateChannelMessages(channelId, currentChannelPage);
    generateSendMessageBlock(channelId, currentChannelPage);

    } else {
        currentChannelPage.style.display = 'block';
    }

    
   
}

// register event listener
document.getElementById('register-submit').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if(password !==passwordConfirm) {
        alert('Password need to match');
    
    } else {
        console.log(email, name, password, passwordConfirm);

        const registerForm = {
            email,
            name,
            password,
        };

        apiCallPost('auth/register', registerForm)
        .then((result)=> {
            console.log(result);
            const {token, id} = result;
            globalToken = token;
            globalUserID = id;
            localStorage.setItem('token', JSON.stringify(result));
            showPage('main');
        })
        .catch((error)=> {
            alert(error);
            console.error(error);
        });
    }

})

// login event listener
document.getElementById('login-submit').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log(email, password);

    const loginForm = {
        email,
        password,
    }

    apiCallPost('auth/login', loginForm)
    .then((result) => {
        console.log(result);
        const {token, userId} = result;
        globalToken = token;
        globalUserID = userId;
        console.log(globalUserID);
        localStorage.setItem('token', JSON.stringify(result));
        showPage('main');
    })
    .catch((error) => {
        alert(error);
        console.error(error);
    }) 
})


// log out event listener
document.getElementById('log-out-button').addEventListener('click', () => {
    apiCallPost('auth/logout', {}, true, globalToken)
        .then(() => {
            localStorage.removeItem('token');
            showPage('login');
        })
        .catch((error) => {
            console.error(error);
        })

})

function getUserInfoById(userId) {
    return apiCallGet(`user/${userId}`, globalToken)
        .then((result) => {
            // console.log(result);
            return result;
        })
        .catch((error) => {
            alert(error);
            console.error(error);
            throw error;
        });
}




function updateInviteUserList() {
    const selectedChannel = document.getElementById('modal-channel-select');
    console.log(selectedChannel);
    const selectedChannelId = selectedChannel.value;
    console.log(selectedChannelId);

    let memberList;

    apiCallGet(`channel/${selectedChannelId}`, globalToken)
        .then((result) => {
            memberList = result.members;
            console.log(memberList);

            return apiCallGet('user', globalToken)
            .then((userResult) => {
                return { memberList, users: userResult.users };
            });
        })

        .then(({ memberList, users }) => {
            const userList = document.getElementById('modal-user-list');
            while (userList.firstChild) {
                userList.removeChild(userList.firstChild);
            }

            const nonMemberUsers = users.filter(user => !memberList.includes(user.id));
            const userPromises = nonMemberUsers.map((user) => {
                return getUserInfoById(user.id)
                    .then((userInfo) => {
                        return { ...userInfo, id: user.id };
                    })
                    .catch((error) => {
                        console.error('Error fetching user info', error);
                        alert(error);
                    });
            });

            Promise.all(userPromises)
            .then((usersWithInfo) => {
                usersWithInfo.sort((a, b) => a.name.localeCompare(b.name))
                .forEach((user) => {
                    const li = document.createElement('li');
                    li.textContent = user.name;
                    li.dataset.userId = user.id;
                    li.onclick = () => li.classList.toggle('selected');
                    userList.appendChild(li);
                });
            });
        })

        .catch((error)=> {
        alert(error);
        console.error(error);
        });


}
function openModal() {
    document.getElementById('inviteModal').style.display = 'block';
    updateInviteUserList();
  }
  
  function closeModal() {
    document.getElementById('inviteModal').style.display = 'none';
  }


// invite people to channel listener
document.getElementById('invite-people-button').addEventListener('click', ()=> {
    openModal();
})

document.getElementById('invite-modal-close').addEventListener('click', ()=> {
    closeModal();
})

//
document.getElementById('modal-submit-button').addEventListener('click', ()=> {
    const channelSelect = document.getElementById('modal-channel-select');
    const channelId = channelSelect.value;

    const selectedUsers = document.querySelectorAll('#modal-user-list li.selected');

    console.log(selectedUsers, Array.from(selectedUsers), Array.from(selectedUsers)[0].dataset);

    const userIds = Array.from(selectedUsers).map(li => li.dataset.userId);

    const invitationPromises = userIds.map(userId=> {
        return apiCallPost(`channel/${channelId}/invite`, {userId: parseInt(userId)}, true, globalToken)
        .then((result) => {
            console.log(`${userId} is successly invited to ${channelId}`);
        })
        .catch((error) => {
            alert(error);
            console.error(error);
        }) 
    })

    Promise.all(invitationPromises)
    .then(() => {
        updateInviteUserList();
    })
    .catch((error) => {
        console.error('Error sending invitations', error);
    });

})

//
document.getElementById('modal-channel-select').addEventListener('change', updateInviteUserList);


// create channel listener
document.getElementById('create-channel-button').addEventListener('click',()=> {
    for (const data of document.querySelectorAll('.create-channel-form')) {
        data.style.display = 'block';
    }
})

document.getElementById('create-channel-submit').addEventListener('click', () => {
    const name = document.getElementById('channel-name').value;
    let description = document.getElementById('channel-description').value;
    if (description === 'introduce your channel.....') {
        description = 'There is no extra information about this channel';
    }

    let isPrivateRoom = false;
    const currentTime = new Date();

    const radioResult = document.querySelector('input[name="choice-radio"]:checked');
    if (radioResult) {
        if (document.querySelector('input[name="choice-radio"]:checked').value === 'yes') {
            isPrivateRoom = true;
        }
    } else {
        alert('Please choose Yes or No');
    }


    console.log(name, description. isPrivateRoom);


    apiCallPost('channel', {
        "name": name,
        "private": isPrivateRoom,
        "description": description,
    }, true, globalToken)
    .then((result) => {
        console.log(result);
        const channelInfo = {
            name: name,
            creater: globalUserID,
            private: isPrivateRoom,
            description: description,
            createAt: currentTime,
            id: result.channelId,
        };
        channelList.push(channelInfo);
        localStorage.setItem(`channel${result.channelId}`, JSON.stringify(channelInfo));
        console.log(JSON.stringify(channelInfo));
        console.log(JSON.parse((JSON.stringify(channelInfo))));
        closeCreateChannelForm();
        document.dispatchEvent(showChannelLists);
    })
    .catch((error) => {
        alert(error);
        console.error(error);
    }) 
    
})

// show channel lists
document.addEventListener('showChannelLists', ()=> {
    apiCallGet('channel', globalToken)
    .then((result) => {
        console.log(result);
        const publicLists = document.getElementById('public-channel-list');
        const privateLists = document.getElementById('private-channel-list');

        for (const channel of result.channels) {
            if (channel.private === false) {
                appendChannelInfo(publicLists, channel);
            } else {
                if(channel.members.includes(globalUserID)) {
                    appendChannelInfo(privateLists, channel);
                }
            }

        } 
    })
    .catch((error)=> {
        alert(error);
        console.error(error);
    })
})





// get into channel 
document.addEventListener('click', (e)=> {
    if (e.target.classList.contains('channel-button')) {
        const channelButton = e.target;
        console.log(channelButton);
        const channelId = channelButton.getAttribute('id');
        
        apiCallGet(`channel/${channelId}`, globalToken)
        .then((result) => {
            console.log(result);
            getIntoChannel(result, channelButton);
            showPage(`channel${channelId}`);
         
        })
        .catch((error) => {
            alert('you are not a member of this channel, please join in first')
            console.error(error);
        });
    }
})




for (const redirect of document.querySelectorAll('.redirect')) {
    const newPage = redirect.getAttribute('data-redirect');
    redirect.addEventListener('click', ()=> {
        showPage(newPage);
    })
}

let channelList = [];
let globalToken = null;
let globalUserID = null;
const userInfo = JSON.parse(localStorage.getItem('token'));
const showChannelLists = new Event('showChannelLists');
// const closeChannelLists = new Event('closeChannelLists');


console.log(userInfo);
if (userInfo !== null) {
    globalToken = userInfo['token'];
    globalUserID = userInfo['userId'];
}

if (globalToken == null) {
    showPage('register');
} else {
    showPage('login');
}

