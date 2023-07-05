const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let overJoinTeamSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    }, 
    type: {       
        type: String,
        default: "overfantasy"
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
  question:[{
        questionId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"question"
        },
        answer:{
            type:String
        },
        time:{
            type:String,
            default:""
        }
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
module.exports = mongoose.model('overjointeam', overJoinTeamSchema);