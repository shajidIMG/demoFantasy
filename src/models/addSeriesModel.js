const mongoose = require("mongoose");
const credentials = require("../config/const_credential");

const seriesData = new mongoose.Schema({
    fantasy_type: {
        type: String,
        default: credentials.FANTASY_TYPE.CRICKET
    },
    name: {
        type: String,
        required: true
    },
    series_key: {
        type: String
    },
    status: {
        type: String,
        default: 'opened'
    },
    start_date: {
        type: String,
        required: true
    },
    end_date: {
        type: String,
        required: true
    },
    has_leaderboard:{
        type:"String",
        default:'no'
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('series', seriesData);