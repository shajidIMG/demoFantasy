const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let JoinTeamSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    
    type: {
        
        type: String,
        default: "cricket"
      },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listMatches',
        index: true
    },
    teamnumber: {
        type: Number,
        default: 0
    },

    overs: [{
        over: {
            type: Number,
            default: 0
        },
        MegaOver: {
            type: Number,
            default: 0
        },
        inning: {
            type: Number,
            default: 0
        },
        points: {
            type: Number,
            default: 0
        },
        teamid: {
            type: mongoose.Schema.Types.ObjectId,

        },
        teamname: {
            type: String,

        },
        type: {
            type: String,
            default: 0
        },
    }],
    players: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'matchplayer'
            }
        ],
        default: []
    },
    // playersArray: {
    //     type: String
    // },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchplayer'
    },
    vicecaptain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchplayer'
    },
    points: {
        type: Number,
        default: 0.0
    },
    lastpoints: {
        type: Number,
        default: 0.0
    },
    player_type: {
        type: String,
        default: 'classic'
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    user_type: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('jointeam', JoinTeamSchema);