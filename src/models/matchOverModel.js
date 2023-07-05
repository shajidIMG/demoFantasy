const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let matchOverSchema = new Schema({
    
    overNo: {
        type: Number,
        required:true
        
    },
    inning: {
        type: Number,
      
    },
    teamId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team'
    }
    ,
    matchId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listMatches'
    }

}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('matchOver', matchOverSchema);