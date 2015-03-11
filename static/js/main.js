
// Author: Sergio Castaño Arteaga
// Email: sergio.castano.arteaga@gmail.com

(function($){

    var debug = false;

    var chatApp = angular.module("chatApp", []);
    chatApp.config(function($interpolateProvider) {
        $interpolateProvider.startSymbol("{[{");
        $interpolateProvider.endSymbol("}]}");
    });

    chatApp.controller('ChatListCtrl', function ($scope, $location) {
        $scope.rooms = [{
                    "room": "MainRoom",
                    "active": "active",
                    "users": [{
                        "room": "MainRoom",
                        "username": "ServerBot",
                        "id": 0
                    }],
                    "messages": [{
                        "room": "MainRoom",
                        "username": "ServerBot",
                        "msg": "----- Welcome to the chat server ----"
                    }]
                }];

        var searchObject = $location.search();
        if (searchObject.room) {
            socket.emit('subscribe', {'rooms': [searchObject.room]}); // http://localhost:8888/index.html#?room=abc
        }         

        $scope.addNewRoom = function(room) {
            if ($scope.checkIfRoomNotExists(room.room)) {
                $scope.rooms.push(room);
            }
        };

        $scope.removeRoom = function(roomToRemove) {
            $.each($scope.rooms, function(i){
                if ($scope.rooms[i].room == roomToRemove) {
                    $scope.rooms.splice(i,1);
                    return false;
                }
            });
        };

        $scope.checkIfRoomNotExists = function(newRoom) {
            var roomNotExists = true;
            $scope.rooms.forEach(function(room) {
                if (room.room == newRoom) {
                    roomNotExists = false;
                }
            });
            return roomNotExists;
        };

        $scope.userNotInRoom = function(user, users) {
            var userNotInRoom = true;
            users.forEach(function(userInList) {
                if (userInList.id === user.id) {
                    userNotInRoom = false;
                }
            });
            return userNotInRoom;
        };

        $scope.addMessage = function(msg) {
            $scope.rooms.forEach(function(room) {
                if (room.room == msg.room) {
                    room.messages.push(msg);
                }
            });

            // Scroll bottom
            var messagesContainer = $("#" + msg.room + " .well div");
            messagesContainer.scrollTop(messagesContainer.height());
        };

        $scope.addUser = function(user) {
            $scope.rooms.forEach(function(room) {
                if (room.room == user.room) {
                    if ($scope.userNotInRoom(user, room.users)) {
                        room.users.push(user);
                    }
                }
            });
        };

        $scope.removeUser = function(userToRemove) {
            $scope.rooms.forEach(function(room) {
                if (room.room == userToRemove.room) {
                    $.each(room.users, function(i){
                        if (room.users[i].id == userToRemove.id) {
                            room.users.splice(i,1);
                            return false;
                        }
                    });
                }
            });
        };

        $scope.updateNickname = function(userToUpdate) {
            $scope.rooms.forEach(function(room) {
                if (room.room == userToUpdate.room) {
                    $.each(room.users, function(i){
                        if (room.users[i].id == userToUpdate.id) {
                            room.users[i].username = userToUpdate.newUsername;
                        }
                    });
                }
            });
        };

        $scope.addUsers = function(users) {
            $scope.rooms.forEach(function(room) {
                room.users = [];
            });
            users.forEach(function(user) {
                $scope.addUser(user);
            });
        };
    });

    var scope;

    function getScope() {
        scope = angular.element(document.getElementById("ChatListCtrl")).scope();       
    }

    function createRoom(roomName) {
        if (scope) {
            scope.$apply(function() {
                scope.addNewRoom({
                    "room": roomName,
                    "active": "",
                    "users": [{
                        "room": roomName,
                        "username": "ServerBot",
                        "id": 0
                    }],
                    "messages": [{
                        "room": roomName,
                        "username": "ServerBot",
                        "msg": "----- Welcome to the chat server ----"
                    }]
                });
            });  

            // Get users connected to room
            socket.emit('getUsersInRoom', {'room':roomName});

            $("#" + roomName + "_tab a").click();            
        } else {
            getScope();
        }
    }

    // ***************************************************************************
    // Socket.io events
    // ***************************************************************************
    
    var socket = io.connect('http://localhost:8888');

    // Connection established
    socket.on('connected', function (data) {

        // Get scope - Angular
        getScope();       

        if (debug) {
            // Subscription to rooms
            socket.emit('subscribe', {'username':'sergio', 'rooms':['sampleroom']});

            // Send sample message to room
            socket.emit('newMessage', {'room':'sampleroom', 'msg':'Hellooooooo!'});

            // Auto-disconnect after 10 minutes
            setInterval(function() {
                socket.emit('unsubscribe', {'rooms':['sampleroom']});
                socket.disconnect();
            }, 600000);
        }
    });

    // Disconnected from server
    socket.on('disconnect', function (data) {
        var info = {'room':'MainRoom', 'username':'ServerBot', 'msg':'----- Lost connection to server -----'};
        addMessage(info);
    });
    
    // Reconnected to server
    socket.on('reconnect', function (data) {
        var info = {'room':'MainRoom', 'username':'ServerBot', 'msg':'----- Reconnected to server -----'};
        addMessage(info);
    });

    // Subscription to room confirmed
    socket.on('subscriptionConfirmed', function(data) {
        // Create room space in interface
        createRoom(data.room);

        // Close modal if opened
        $('#modal_joinroom').modal('hide');
    });

    // Unsubscription to room confirmed
    socket.on('unsubscriptionConfirmed', function(data) {
        // Remove room space in interface
        scope.$apply(function() {
            scope.removeRoom(data.room);
        });
    });

    // User joins room
    socket.on('userJoinsRoom', function(data) {
        console.log("userJoinsRoom: %s", JSON.stringify(data));
        // Log join in conversation
        addMessage(data);  
    
        // Add user to connected users list
        addUser(data);
    });

    // User leaves room
    socket.on('userLeavesRoom', function(data) {
        console.log("userLeavesRoom: %s", JSON.stringify(data));
        // Log leave in conversation
        addMessage(data);

        // Remove user from connected users list
        removeUser(data);
    });

    // Message received
    socket.on('newMessage', function (data) {
        console.log("newMessage: %s", JSON.stringify(data));
        addMessage(data);
    });

    // Users in room received
    socket.on('usersInRoom', function(data) {
        console.log('usersInRoom: %s', JSON.stringify(data));

        // Add ServerBot user at first
        data.users.unshift({
            id: 0,
            username: "ServerBot",
            room: data.room
        });

        scope.$apply(function() {
            scope.addUsers(data.users);
        });
        
    });

    // User nickname updated
    socket.on('userNicknameUpdated', function(data) {
        console.log("userNicknameUpdated: %s", JSON.stringify(data));
        updateNickname(data);

        msg = '----- ' + data.oldUsername + ' is now ' + data.newUsername + ' -----';
        var info = {'room':data.room, 'username':'ServerBot', 'msg':msg};
        addMessage(info);
    });

    // ***************************************************************************
    // Helpers
    // ***************************************************************************

    // Add message to room
    var addMessage = function(msg) {
        scope.$apply(function() {
            scope.addMessage(msg);
        });  
    };
    
    // Add user to connected users list
    var addUser = function(user) {
        scope.$apply(function() {
            scope.addUser(user);
        });  
    };

    // Remove user from connected users list
    var removeUser = function(user) {
        scope.$apply(function() {
            scope.removeUser(user);
        }); 
    };

    // Get current room
    var getCurrentRoom = function() {
        return $('li[id$="_tab"][class="active"]').text().trim();
    };

    // Get message text from input field
    var getMessageText = function() {
        var text = $('#message_text').val();
        $('#message_text').val("");
        return text;
    };

    // Get room name from input field
    var getRoomName = function() {
        var name = $('#room_name').val();
        $('#room_name').val("");
        return name;
    };

    // Get nickname from input field
    var getNickname = function() {
        var nickname = $('#nickname').val();
        $('#nickname').val("");
        if (nickname != "") {
            return nickname;
        } else {
            return false;
        }
    };

    // Update nickname in badges (all collections)
    var updateNickname = function(data) {
        scope.$apply(function() {
            scope.updateNickname(data);
        });   
    };

    // ***************************************************************************
    // Events
    // ***************************************************************************

    // Send new message
    $('#b_send_message').click(function(eventObject) {
        eventObject.preventDefault();
        if ($('#message_text').val() != "") {
            socket.emit('newMessage', {'room':getCurrentRoom(), 'msg':getMessageText()});
        }
    });

    // Click button "Join room" to press Return key
    $('#room_name').keyup(function(event){
        if( event.keyCode == 13){
            $('#b_join_room').click();
        }
    });

    // Join new room
    $('#b_join_room').click(function(eventObject) {
        eventObject.preventDefault();
        socket.emit('subscribe', {'rooms':[getRoomName()]}); 
    });

    // Leave current room
    $('#b_leave_room').click(function(eventObject) {
        eventObject.preventDefault();
        var currentRoom = getCurrentRoom();
        if (currentRoom != 'MainRoom') {
            socket.emit('unsubscribe', {'rooms':[getCurrentRoom()]}); 

            // Toogle to MainRoom
            $('[href="#MainRoom"]').click();
        } else {
            console.log('Cannot leave MainRoom, sorry');
        }
    });

    // Set nickname
    $('#b_set_nickname').click(function(eventObject) {
        eventObject.preventDefault();
        var newName = getNickname();
        if (newName) {
            socket.emit('setNickname', {'username':newName});
        }

        // Close modal if opened
        $('#modal_setnick').modal('hide');
    });

    // Click button "Set nickname" to press Return key
    $('#nickname').keyup(function(event){
        if( event.keyCode == 13){
            $('#b_set_nickname').click();
        }
    });

})(jQuery);

