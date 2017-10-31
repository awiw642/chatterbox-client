// YOUR CODE HERE:

$(document).ready(() => {
  app.init();
});

const app = {
  server: 'http://parse.hrr.hackreactor.com/chatterbox/classes/messages',
  username: window.location.search.substr(10) || 'anonymous',
  roomname: 'lobby',
  messages: [],
  friends: {},
  lastMessageId: 0
};

app.init = () => {
  app.$message = $('#message');
  app.$chats = $('#chats');
  app.$roomSelect = $('#roomSelect');
  app.$send = $('#send');

  // Listeners
  app.$chats.on('click', '.username', app.handleUsernameClick);
  app.$send.on('submit', app.handleSubmit);
  app.$roomSelect.on('change', app.handleRoomChange);

  app.fetch(false);

  setInterval(() => {
    // console.log('APP INSIDE OF INTERVAL', app);
    app.fetch(true);
  }, 3000);

};

app.send = (message) => {
  $.ajax({
    url: app.server,
    type: 'POST',
    data: message,
    success: (data) => {
      // console.log('inside POST ---->', data);
      app.$message.val('');
      app.fetch();
    }
  });
};

app.fetch = () => {
  $.ajax({
    url: app.server,
    type: 'GET',
    contentType: 'application/json',
    data: {order: '-createdAt'},
    success: (data) => {
      if (!data.results || !data.results.length) {
        return;
      }
      // console.log('inside GET ---->', data);
      app.messages = data.results;
      let recentMessage = app.messages[0];
      // console.log('RECENT MESSAGE ---->', recentMessage);
      if (recentMessage !== app.lastMessageId) {
        app.renderRoomList(data.results);
        app.renderMessages(data.results);
        app.lastMessageId = recentMessage.objectId;
      }
    },
    error: () => {
      console.log('Fetch req failed');
    }
  });
};

app.clearMessages = () => {
  $('#chats').html('');
};

app.renderMessage = (message) => {
  let $newChat = $('<div class="chat"></div>');
  let msg = filterXSS(message.text);
  let username = filterXSS(decodeURI(message.username));
  let roomname = filterXSS(message.roomname);

  $newChat.html(`<span href=# class="username" data-username="${username}" data-roomname="${roomname}">` + username + '<br />' + msg + '</span>');

  // if app.friends[msg.username] === true
  if (app.friends[username] === true) {
    $(`[data-username="${username}"]`).addClass('friend');
   // then we add a class of friend
  }

  app.$chats.append($newChat);
};

app.renderMessages = (messages) => {
  // debugger;
  // clear all messages;
  app.clearMessages();
  // for each message in the array
  if (Array.isArray(messages)) {
    app.messages.filter((message) => {
        return message.roomname === app.roomname || app.roomname === 'lobby' && !message.roomname;
      }).forEach(app.renderMessage);
  }
    // call render message
};

app.renderRoomList = (messages) => {
  app.$roomSelect.html('<option value="__newRoom">New Room</option>');
  if (messages) {
    const rooms = {};
    messages.forEach((message, i) => {
      let roomname = message.roomname;
    //console.log(roomname);
      if (roomname && !rooms[roomname]) {
        app.renderRoom(roomname);
        rooms[roomname] = true;
      }
    });
  }
  // set the selector app.roomname;
  app.$roomSelect.val(app.roomname);
};

app.renderRoom = (roomname) => {
  // let $newRoom = $('<div className="chat"></div>');
  let $option = $('<option/>').val(roomname).text(roomname);
  // $roomSelect has .attr(val) -> don't append
  app.$roomSelect.append($option);
};

/* ----------> EVENT HANDLERS <----------*/

app.handleUsernameClick = (event) => {
  let username = $(event.target).data('username');
  if (username !== undefined) {
    // Add it to your friend list object
    app.friends[username] = !app.friends[username];
    // Add a new friend class to the DOM
    let selector = '[data-username="' + username.replace(/"/g, '\\\"') + '"]';
    // console.log('SELECTOR ----->', selector);
    let $usernames = $(selector).toggleClass('friend');
  }
};

app.handleSubmit = (event) => {
  const message = {
    username: app.username,
    text: $('#message').val(),
    roomname: app.roomname || 'lobby'
  };
  app.send(message);
  event.preventDefault();
};

app.handleRoomChange = (event) => {
  let selectIndex = app.$roomSelect.prop('selectedIndex');
  if(selectIndex === 0) {
    let roomname = prompt('Enter room name...');
    if (roomname) {
      app.roomname = roomname;
      app.renderRoom(roomname);
      app.$roomSelect.val(roomname);
    }
  } else {
    app.roomname = app.$roomSelect.val();
  }
  app.renderMessages(app.messages);
};