const Discord = require('discord.js');
const client = new Discord.Client();
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./db.json')
const db = low(adapter)

var auth = require('./auth.json');

var isVotingStarted = false;
var votes = {}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    var message = msg.content;
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);

        // console.log(cmd);

        switch(cmd) {
            case 'votingstart':
                votingStart(msg, args);
                break;
            case 'vote':
                vote(msg, args);
                break;
            case 'votingend':
                votingEnd(msg, args);
                break;
            case 'results':
                results(msg, args);

            break;
        }
    }
});

var checkOwner = function(msg, reply){
    if (msg.author.username !== 'ChaoticOne' || msg.author.discriminator !== '7667')
    {
        msg.channel.send(reply)
        return true;
    }

    return false
}

var votingStart = function(msg, args){
    if (checkOwner(msg, "Only bot owner can start votings.")){
        return;
    }

    var reply = "Voting started";
    var topic = args[0];
    if (topic){
        var voting = db.get('currentVotings').find({name: topic}).value();

        if (voting){
            msg.channel.send("Voting already exists.");
            return;
        }

        reply += " on topic '" + topic + "'!\n" +
        "Please write '!vote *topicname* yes/no' to participate.\n"+
        "You can PM the bot if you want private voting."

        db.get('currentVotings').push({ name: topic, ongoing: true }).write();
    }
    else {
        msg.channel.send("Please write a topic to vote for.");
        return;
    }
    msg.channel.send(reply);
};


var votingEnd = function(msg, args){
    if (checkOwner(msg, "Only bot owner can end votings.")){
        return;
    }

    var reply = "Voting started";
    var topic = args[0];
    if (topic){
        var voting = db.get('currentVotings').find({name: topic}).value();

        if (!voting){
            msg.channel.send("Voting doesn't exist.");
            return;
        }

        if (!voting.ongoing){
            msg.channel.send("Voting on this topic already stopped.")
            return;
        }

        db.get('currentVotings').find({name: topic}).assign({ ongoing: false }).write();

        msg.channel.send("Voting successfully ended.");
        return;
    }
    else {
        msg.channel.send("Please write a topic to end.");
        return;
    }
}


var vote = function(msg, args){
    var author = msg.author.username + '#' + msg.author.discriminator;
    var topic = args[0];
    var answer = args[1];

    var voting = db.get('currentVotings').find({name: topic}).value();

    if (!voting){
        msg.channel.send("No such topic is currently being voted for.");
        return;
    }

    if (!voting.ongoing){
        msg.channel.send("Voting on this topic already stopped.")
        return;
    }

    if (answer !== 'yes' && answer !== 'no'){
        msg.channel.send("Answer must be 'yes' or 'no', not '"+answer+"'");
        return;
    }

    var vote = db.get('votes').find({'votingName': topic, 'author': author}).value();

    if (vote){
        msg.channel.send("You have already voted.")
        return;
    }
    else {
        db.get('votes').push({
            votingName: topic,
            author: author,
            answer: answer
        }).write();
        msg.channel.send("Your vote has been successfully counted.")
    }
}

var results = function(msg, args){
    var topic = args[0];

    var voting = db.get('currentVotings').find({name: topic}).value();

    if (!voting){
        msg.channel.send("There were no votings on such topic.");
        return;
    }

    var yesCount = db.get('votes').filter({votingName: topic, answer:'yes'}).value().length;
    var noCount = db.get('votes').filter({votingName: topic, answer:'no'}).value().length;

    var reply = "Results of '"+topic+"' voting.\n" +
        "Yes votes: " + yesCount + "\n" +
        "No votes: " + noCount

    msg.channel.send(reply);
}

client.login(auth.token);
