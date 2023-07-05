const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let leaugestransaction = new Schema({
    bonus: {
        type: Number,
        default: 0
    },
    winning: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true,
    versionKey: false
})
// --------------------------------------------------------------//
let overJoinleaugeSchema = new Schema({

    // transaction_id: {
    //     type: String,
    //     default: ''
    // },
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
    leaugestransaction: leaugestransaction,
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
module.exports = mongoose.model('overjoinedleauge', overJoinleaugeSchema);