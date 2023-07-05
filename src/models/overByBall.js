const mongoose = require("mongoose");


const overByBallSchema = new mongoose.Schema({
   overId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"matchOver"
    },
    eventId: {
        type: String,
    },
    overNo: {
        type: Number,
        default:0
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"team"
    },
    ball: {
        type: Number,
        default:0
    },
    score: {
        type: String,
        default:0
    },
    commentary: {
        type: String,
    },
    noball_run: {
        type: Number,
        default:0
    },
    wide_run: {
        type: Number,
        default:0
    },
    bye_run:{
        type: Number,
        default:0
    },
    legbye_run: {
        type: Number,
        default:0
    },
    bat_run:{
        type: Number,
        default:0
    },
    noball: {
        type: Boolean,
        default:false
    },
    wideball: {
        type: Boolean,
        default:false
    },
    six: {
        type: Boolean,
        default:false
    },
    four: {
        type: Boolean,
        default:false
    },
    wicket:{
        type:Boolean,
        default:false
    },
    batsmen:{
        type:Array,
        default:[]
    },
    bowlers:{
        type:Array,
        default:[]
    },
    timestamp:{
       type:String 
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('overbyball', overByBallSchema);