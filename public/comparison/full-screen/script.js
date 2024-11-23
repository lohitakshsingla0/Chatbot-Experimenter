$(document).ready(function () {
    let chatSessions = {};
    let currentChatId = null;

    function appendMessage(chatId, sender, text) {
        const messageElement = `
            <div class="message ${sender}">
                <div class="message-text">${text}</div>
            </div>
        `;
        chatSessions[chatId].messages.push({ sender, text });
        if (chatId === currentChatId) {
            $('#chatBody').append(messageElement);
            $('#chatBody').scrollTop($('#chatBody')[0].scrollHeight);
        }
    }

    function processUserInput(chatId, input) {
        appendMessage(chatId, 'user', input);
        $.ajax({
            url: '/process-message',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ message: input }),
            success: function (data) {
                console.log('Server response:', data);
                appendMessage(chatId, 'bot', data.response);
            },
            error: function (error) {
                console.error('Error:', error);
            }
        });
    }
    

    function switchChat(chatId) {
        currentChatId = chatId;
        $('#chatBody').empty();
        chatSessions[chatId].messages.forEach(msg => {
            const messageElement = `
                <div class="message ${msg.sender}">
                    <div class="message-text">${msg.text}</div>
                </div>
            `;
            $('#chatBody').append(messageElement);
        });
        $('.list-group-item').removeClass('active');
        $(`[data-chat-id="${chatId}"]`).addClass('active');
        $('#chatBody').scrollTop($('#chatBody')[0].scrollHeight);
    }

    function createNewChat() {
        const chatId = 'chat_' + Date.now();
        const chatNumber = Object.keys(chatSessions).length + 1;
        chatSessions[chatId] = { number: chatNumber, messages: [] };
        $('#chatList').append(`
            <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-chat-id="${chatId}">
                Chat ${chatNumber}
                <span class="close-btn" data-chat-id="${chatId}">&times;</span>
            </li>
        `);
        switchChat(chatId);
    }

    $('#sendButton').click(function () {
        const userInput = $('#userInput').val();
        if (userInput && currentChatId) {
            processUserInput(currentChatId, userInput);
            $('#userInput').val('');
        }
    });

    $('#userInput').keypress(function (e) {
        if (e.which === 13) {
            $('#sendButton').click();
        }
    });

    $('#newChatButton').click(function () {
        createNewChat();
    });

    $(document).on('click', '.list-group-item', function () {
        const chatId = $(this).data('chat-id');
        if (!$(this).find('.close-btn').is(':hover')) {
            switchChat(chatId);
        }
    });

    $(document).on('click', '.close-btn', function (e) {
        e.stopPropagation();
        const chatId = $(this).data('chat-id');
        delete chatSessions[chatId];
        $(this).closest('.list-group-item').remove();
        if (currentChatId === chatId) {
            currentChatId = null;
            $('#chatBody').empty();
        }

        // Renumber remaining chats
        let chatNumber = 1;
        $('#chatList .list-group-item').each(function() {
            const chatId = $(this).data('chat-id');
            chatSessions[chatId].number = chatNumber;
            $(this).contents().first()[0].textContent = `Chat ${chatNumber}`;
            chatNumber++;
        });
    });

    // Initialize with one chat session
    createNewChat();
});
