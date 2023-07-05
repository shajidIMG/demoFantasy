const mongoose = require('mongoose');
const Schema = mongoose.Schema;
    // --------------------------------------------------------------//
let overleaderboardSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    overId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "matchOver"
    },
    challengeid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchchallenges',
        index: true
    },
    teamid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'jointeam'
    },
    teamnumber: {
        type: Number,
        default: 0
    },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listmatch',
        index: true
    },
    onestar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchplayer'
    },
    twostar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchplayer'
    },
    threestar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchplayer'
    },
    players: {
        type: String,
        default:""
        
    },
    points: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: 0
    },
    teamnumber:{
        type: Number,
        default: 0
    },
    
}, {
    timestamps: true,
    
})
module.exports = mongoose.model('overleaderboard', overleaderboardSchema);