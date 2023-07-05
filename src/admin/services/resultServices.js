const mongoose = require('mongoose');
const moment = require('moment');
const axios = require("axios")
const randomstring = require("randomstring");
const profitLossModel = require("../../models/profitLoss");
const constant = require('../../config/const_credential');
const randomizePlayerSelectionClassic = require("../services/randomizePlayerSelectionClassic");
const listMatches = require('../../models/listMatchesModel');
const seriesModel = require("../../models/addSeriesModel");
const matchPlayers = require('../../models/matchPlayersModel');
const Redis = require('../../utils/redis');
const resultMatch = require('../../models/resultMatchModel')
const resultPoint = require('../../models/resultPointModel')
const matchChallenge = require('../../models/matchChallengersModel')
const joinTeam = require('../../models/JoinTeamModel')
const joinLeague = require('../../models/JoinLeaugeModel')
const JoinLeaugeModel = require('../../models/JoinLeaugeModel')
const matchRuns = require('../../models/matchRunModel')
const refundMatch = require('../../models/refundModel')
const entityApiController = require('../controller/entityApiController');
const series_leaderboardModel = require("../../models/seriesLeaderBoardModel")
const matchServices = require('./matchServices');
const TransactionModel = require('../../models/transactionModel');
const userModel = require('../../models/userModel');
const finalResultModel = require('../../models/finalResultModel');
const tdsDetailModel = require('../../models/tdsDetailModel');
const fs = require('fs');
const listMatchesModel = require('../../models/listMatchesModel');
const refundMatchModel = require("../../models/refundModel")
// ------------
const LevelServices = require("../services/LevelServices");
const matchChallengersModel = require('../../models/matchChallengersModel');
const chalengeServices = require("../services/challengersService")
const teamModel = require("../../models/teamModel");
//const seriesModel = require("../../models/addSeriesModel");
const playersModel = require("../../models/playerModel");
const youtuberBonusModel = require("../../models/youtuberBonusModel");
const playingNotification = require("../../models/playingNotification");
const notification = require("../../utils/notifications");
// -----------
const role = {
    'bowl': 'bowler',
    'bat': 'batsman',
    'all': 'allrounder',
    'wk': 'keeper',
    'wkbat': 'keeper',
    'cap': 'allrounder',
    'squad': 'allrounder',
}
class resultServices {
    constructor() {
        return {
            getUser: this.getUser.bind(this),
            showPlaying: this.showPlaying.bind(this),
            updateResultMatches: this.updateResultMatches.bind(this),
            findMatchPlayers: this.findMatchPlayers.bind(this),
            findMatchPlayers1: this.findMatchPlayers1.bind(this),
            refundAmount: this.refundAmount.bind(this),
            allRefundAmount: this.allRefundAmount.bind(this),
            distributeWinningAmount: this.distributeWinningAmount.bind(this),
            insertProfitLossData: this.insertProfitLossData.bind(this),
            userpoints: this.userpoints.bind(this),
            series_leaderboard: this.series_leaderboard.bind(this),
            getScoresUpdates: this.getScoresUpdates.bind(this),
            playerPoint: this.playerPoint.bind(this),
            cancelMatch: this.cancelMatch.bind(this),
            importPlayer: this.importPlayer.bind(this),
            callingForExtraPlayer: this.callingForExtraPlayer.bind(this),
            userTeamModified: this.userTeamModified.bind(this),
        }
    }

    async findMatchPlayers1(matchid, players_key = null, play11 = null) {
        let pipeline = [];
        pipeline.push({
            $match: {
                matchkey: mongoose.Types.ObjectId(matchid),
                playerid: mongoose.Types.ObjectId('623e0ef74953dea5ce2bea18')
            }
        })

        pipeline.push({
            $lookup: {
                from: 'players',
                localField: 'playerid',
                foreignField: '_id',
                as: 'playersData'
            }
        })
        if (players_key && players_key != null) {
            pipeline.push({
                $match: {
                    "playersData.players_key": players_key
                }
            })
        }

        if (play11 && play11 != null) {
            pipeline.push({
                $match: {
                    "playingstatus": 1
                }
            })
        }
        pipeline.push({
            $unwind: { path: "$playersData" }
        })
        let result = await matchPlayers.aggregate(pipeline);
        return result;
    }

    async findMatchPlayers(matchid, players_key = null, play11 = null) {
        let pipeline = [];

        pipeline.push({
            $match: { matchkey: mongoose.Types.ObjectId(matchid) }
        })

        pipeline.push({
            $lookup: {
                from: 'players',
                localField: 'playerid',
                foreignField: '_id',
                as: 'playersData'
            }
        })
        if (players_key && players_key != null) {
            pipeline.push({
                $match: {
                    "playersData.players_key": players_key
                }
            })
        }

        if (play11 && play11 != null) {
            pipeline.push({
                $match: {
                    "playingstatus": 1
                }
            })
        }
        pipeline.push({
            $unwind: { path: "$playersData" }
        })
        let result = await matchPlayers.aggregate(pipeline);
        // console.log("===============================-result-================",result[0])
        return result;
    }

    // this is for extra player uodate by api
    async callingForExtraPlayer(response, matchkey) {
        // let lastresponse=JSON.parse(myresponse.playersdata);

        // let response=lastresponse.response
        let team1Id = response.teama.team_id;
        let team2Id = response.teamb.team_id;
        let data = await Promise.all([
            this.importPlayer(team1Id, response, matchkey, 'teama'),
            this.importPlayer(team2Id, response, matchkey, 'teamb'),
        ]);
    }
    async importPlayer(teamId, response, matchkey, team) {
        let teamDAta = await teamModel.findOne({ team_key: teamId });
        if (teamDAta) {
            for (let player of response[team].squads) {
                let playerTeam = await playersModel.findOne({ players_key: player.player_id, team: teamDAta._id });

                let checkPlayersKey = response['players'].find(o => o.pid == player.player_id);
                let player_role = (role[checkPlayersKey.playing_role]) ? role[checkPlayersKey.playing_role] : 'allrounder';
                if (playerTeam) {
                    if (! await matchPlayers.findOne({ playerid: playerTeam._id, matchkey })) {
                        let matchPlayerData = new matchPlayers({
                            matchkey: matchkey,
                            playerid: playerTeam._id,
                            credit: playerTeam.credit,
                            name: playerTeam.fullname,
                            role: player_role,
                            legal_name: player.name

                        });
                        let insmatchPlayerData = await matchPlayerData.save();
                        let keyname = `matchkey-${matchkey}-playerid-${playerTeam._id}`
                        let redisdataa = Redis.setkeydata(keyname, insmatchPlayerData, 60 * 60 * 4);
                    }
                } else {
                    let playerData = new playersModel({
                        fantasy_type: 'Cricket',
                        player_name: player.name,
                        players_key: player.player_id,
                        team: teamDAta._id,
                        role: player_role,
                        fullname: player.name,
                    })
                    let insertPlayer = await playerData.save();

                    let matchPlayerData = new matchPlayers({
                        matchkey: matchkey,
                        playerid: insertPlayer._id,
                        credit: insertPlayer.credit,
                        name: player.name,
                        role: player_role,
                        legal_name: player.name

                    })
                    let insmatchPlayerData = await matchPlayerData.save();
                    let keyname = `matchkey-${matchkey}-playerid-${insertPlayer._id}`
                    let redisdataa = Redis.setkeydata(keyname, insmatchPlayerData, 60 * 60 * 4);

                }

            }
        }
    }
    async showPlaying(real_matchkey, matchkey) {
        try {
            const checkmatch = await listMatches.findOne({ _id: matchkey });
            const role = {
                'bowl': 'bowler',
                'bat': 'batsman',
                'all': 'allrounder',
                'wk': 'keeper',
                'wkbat': 'keeper',
                'cap': 'allrounder',
                'squad': 'allrounder',
            }
            let teamaplayingxi = [];
            let teambplayingxi = [];
            let newplayingxi = [];
            let checkstarted = checkmatch.status;
            if (checkmatch) {
                const responseresult = await entityApiController.getMatchPlayers(real_matchkey);
                // console.log('giveresresult1',giveresresult1);
                // const giveresresult = fs.readFileSync('squads.json', 'utf8');
                if (responseresult) {
                    // const giveresresultNew = JSON.parse(giveresresult1.playersdata);  //with entity url remove this line
                    // let responseresult = giveresresultNew.response;
                    //console.log('responseresult',responseresult.teama.squads);
                    // ------------------- team a ---------------------
                    if (responseresult.teama.squads) {
                        let teamasquads = responseresult.teama.squads;
                        let teamkey = responseresult.teama.team_id;
                        // console.log(teamkey);
                        teamasquads.forEach(async index => {
                            if (index.playing11 == 'true') {
                                teamaplayingxi.push(index.player_id);
                                let matchplayersid = await this.findMatchPlayers(checkmatch._id, index.player_id);
                                if (matchplayersid[0]) {
                                    const playing11status = 1;
                                    const updatedMatchPlayer = await matchPlayers.findOneAndUpdate({ '_id': matchplayersid[0] }, { playingstatus: playing11status }, { new: true });
                                    let keyname = `matchkey-${matchkey}-playerid-${updatedMatchPlayer.playerid}`;
                                    Redis.setkeydata(keyname, updatedMatchPlayer, 60 * 60 * 4);
                                }
                                else {
                                    this.callingForExtraPlayer(responseresult, checkmatch._id)
                                }
                            }
                        })
                    }
                    // ------------------ team b -----------------
                    if (responseresult.teamb.squads) {
                        let teambsquads = responseresult.teamb.squads;
                        let teamb = [];
                        //console.log("playingstatus")
                        let teamkey = responseresult.teamb.team_id;
                        teambsquads.forEach(async index => {
                            if (index.playing11 == 'true') {
                                teambplayingxi.push(index.player_id)
                                let matchplayersid = await this.findMatchPlayers(checkmatch._id, index.player_id);
                                if (matchplayersid[0]) {
                                    const playing11status = 1;
                                    const updatedMatchPlayer = await matchPlayers.findOneAndUpdate({ '_id': matchplayersid[0] }, { playingstatus: playing11status }, { new: true });
                                    let keyname = `matchkey-${matchkey}-playerid-${updatedMatchPlayer.playerid}`;
                                    Redis.setkeydata(keyname, updatedMatchPlayer, 60 * 60 * 4);
                                }
                                else {
                                    this.callingForExtraPlayer(responseresult, checkmatch._id);
                                }
                            }
                        })
                    }
                }
            }
            if (teamaplayingxi.length > 0 && teambplayingxi.length > 0) {
                let newplayingXi = [...teamaplayingxi, ...teambplayingxi];
                let allMatchPlayers = await this.findMatchPlayers(checkmatch._id);
                for (let player of allMatchPlayers) {
                    let playing11status = newplayingXi.includes(player.playersData.players_key) ? 1 : 0;
                    //sahil redis
                    let redismatches = await matchPlayers.find({ '_id': player })
                    for (let redisdataa of redismatches) {
                        let keyname = `matchkey-${matchkey}-playerid-${redisdataa.playerid}`
                        let redisdata = await Redis.getkeydata(keyname);
                        if (redisdata) {
                            redisdata["playingstatus"] = playing11status;
                            let redisdataa = Redis.setkeydata(keyname, redisdata, 60 * 60 * 4);

                        }
                    }
                    let updatedMatchPlayer= await matchPlayers.findOneAndUpdate({ '_id': player }, { playingstatus: playing11status }, { new: true });
                    let keyname = `matchkey-${matchkey}-playerid-${updatedMatchPlayer.playerid}`;
                    Redis.setkeydata(keyname, updatedMatchPlayer, 60 * 60 * 4);
                    let findResult = await resultMatch.findOne({ matchkey: mongoose.Types.ObjectId(checkmatch._id), player_id: player.playerid, innings: 1 });
                    let datasv = {};
                    datasv.matchkey = mongoose.Types.ObjectId(checkmatch._id);
                    datasv.player_key = player.playersData.players_key;
                    datasv.player_id = player.playerid;
                    datasv.innings = 1;
                    datasv.starting11 = playing11status;
                    if (findResult) {
                        await resultMatch.updateOne({ _id: mongoose.Types.ObjectId(findResult._id) }, {
                            $set: datasv
                        });
                    } else {
                        await resultMatch.create(datasv);
                    }
                }
            }

            if (teamaplayingxi.length > 0 || teambplayingxi.length > 0) {
                let playing11_status = 1;
                await listMatches.findOneAndUpdate({ '_id': checkmatch._id }, { playing11_status: playing11_status }, { new: true });
            }
            if (checkstarted == 'notstarted') {
                let checknotify = await playingNotification.findOne({ 'matchkey': checkmatch._id });
                if (checknotify) {
                    let playing11 = await this.findMatchPlayers(checkmatch._id, null, 1);
                    if (playing11.length == 22) {
                        await playingNotification.create({ 'matchkey': checkmatch._id });
                        let matchPipe = [];
                        matchPipe.push({
                            $match: { _id: mongoose.Types.ObjectId(checkmatch._id) }
                        });
                        matchPipe.push({
                            $lookup: {
                                from: 'teams',
                                localField: 'team1Id',
                                foreignField: '_id',
                                as: 'team1'
                            }
                        });
                        matchPipe.push({
                            $lookup: {
                                from: 'teams',
                                localField: 'team2Id',
                                foreignField: '_id',
                                as: 'team2'
                            }
                        });
                        matchPipe.push({
                            $project: {
                                team1name: { $arrayElemAt: ['$team1.short_name', 0] },
                                team2name: { $arrayElemAt: ['$team2.short_name', 0] },
                                playing11_status: 1
                            }
                        })
                        const result = await listMatchesModel.aggregate(matchPipe);
                        let msg = 'Create/Edit Your Team & Join The Contests Before The Deadline. Hurry!';
                        let titleget = `${result[0].team1name} VS ${result[0].team2name} Playing XI Out!`;
                        let user = await this.getUser({ app_key: { $nin: ["", null] } });
                        let receiverId = [];
                        let entityId = [];
                        let appKey = [];
                        for (let memb of user) {
                            appKey.push(memb.app_key);
                            receiverId.push(memb._id);
                            entityId.push(memb._id);
                        }
                        const notificationObject = {
                            type: 'Lineup Notification',
                            title: titleget,
                            message: msg,
                            deviceTokens: appKey,
                            receiverId,
                            entityId
                        };
                        await notification.PushAllNotifications(notificationObject);
                    }
                }

            }
        } catch (error) {
            console.log("error", error)

        }
    }
    async getUser(query) {
        try {
            return await userModel.find(query)
        } catch (error) {
            throw error;
        }
    }
    async updateResultMatches(req) {
        try {
            const currentDate = moment().subtract(7, 'days').format('YYYY-MM-DD 00:00:00');
            const listmatches = await listMatches.find({
                fantasy_type: "Cricket",
                start_date: { $gte: currentDate },
                launch_status: 'launched',
                //  real_matchkey: "62762",
                final_status: { $nin: ['winnerdeclared', 'IsCanceled'] },
                status: { $ne: 'completed' }
            })
            console.log("startabcd" + listmatches)
            if (listmatches.length > 0) {
                for (let index of listmatches) {
                    let matchType = index.format;
                    let matchTimings = index.start_date;
                    let matchTimings1 = moment(matchTimings).subtract(59, 'm').format('YYYY-MM-DD HH:mm:ss');
                    let real_matchkey = index.real_matchkey;
                    let matchkey = index._id;
                    const currentDate1 = moment().format('YYYY-MM-DD HH:mm:ss');

                    if (currentDate1 > matchTimings1) {
                        this.showPlaying(real_matchkey, matchkey);
                    }
                    if (currentDate1 >= matchTimings) {
                        this.getScoresUpdates(real_matchkey, matchkey);
                    }
                }

            }
            return listmatches;

        } catch (error) {
            console.log(error)
        }
    }
    /**
     * @function getScoresUpdates
     * @description Score update Of A Match
     * @param { matchkey }
     * @author Rinku Sain
     */
    async getScoresUpdates(real_matchkey, matchkey) {
        try {
            // console.log("------/////////////---------------getScoresUpdates----------------//////////-----")
            let m_status = {
                1: constant.MATCHES_STATUS.NOT_STARTED,
                2: constant.MATCHES_STATUS.COMPLETED,
                3: constant.MATCHES_STATUS.STARTED,
                4: constant.MATCHES_STATUS.COMPLETED
            };
            let keyname = `listMatchesModel-${matchkey}`;
            // let checkmatch=await Redis.getkeydata(keyname);
            // if(!checkmatch || checkmatch == null){
            //     checkmatch = await listMatchesModel.findOne({ _id: matchkey});
            //     Redis.setkeydata(keyname,checkmatch,60*60*4);
            // }
            const checkmatch = await listMatches.findOne({ _id: matchkey });
            if (checkmatch) {
                let teamainnKey = [];
                let teambinnKey = [];
                const giveresresult = await entityApiController.getMatchScore(real_matchkey);
                // const giveresresult1 = fs.readFileSync('scorecard.json', 'utf8');

                if (giveresresult) {
                    // const giveresresultNew = JSON.parse(giveresresult1.matchdata);  //with entity url remove this line
                    // return giveresresultNew;
                    // let giveresresult = giveresresultNew.response;
                    if (giveresresult) {
                        let matchdata = {};
                        const getMatchRuns = await matchRuns.findOne({ matchkey: mongoose.Types.ObjectId(matchkey) });
                        if (getMatchRuns) {
                            matchdata.matchkey = matchkey;
                            matchdata.teams1 = giveresresult.teama.short_name;
                            matchdata.teams2 = giveresresult.teamb.short_name;
                            matchdata.winning_status = (giveresresult.result) ? giveresresult.result : 0;
                            if (giveresresult.innings) {
                                if (giveresresult.innings.length > 2) {
                                    console.log("hello5")

                                    for (let value of giveresresult.innings) {
                                        if (value.batting_team_id == giveresresult.teama.team_id) {
                                            console.log("b1 value")
                                            teamainnKey.push(value);
                                        } else if (value.batting_team_id == giveresresult.teamb.team_id) {
                                            console.log("b1 else")
                                            teambinnKey.push(value);
                                        }
                                    }
                                } else {

                                    let key1 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teama.team_id);
                                    let key2 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teamb.team_id);

                                    if (key1 >= 0) {
                                        teamainnKey.push(giveresresult.innings[key1]);
                                    } else {
                                        teamainnKey.push([]);
                                    }
                                    if (key2 >= 0) {
                                        teambinnKey.push(giveresresult.innings[key2]);
                                    } else {
                                        teambinnKey.push([])
                                    }
                                }
                                let gettestscore1 = 0;
                                let gettestscore2 = 0;
                                let gettestwicket1 = 0;
                                let gettestwicket2 = 0;
                                let gettestover1 = 0;
                                let gettestover2 = 0;
                                if (teambinnKey[1] && teambinnKey[1]) {
                                    gettestscore2 = (teambinnKey[1]) ? teambinnKey[1].equations.runs : 0;
                                    gettestscore1 = (teamainnKey[1]) ? teamainnKey[1].equations.runs : 0;
                                    gettestwicket1 = (teamainnKey[1]) ? teamainnKey[1].equations.wickets : 0;
                                    gettestwicket2 = (teambinnKey[1]) ? teambinnKey[1].equations.wickets : 0;
                                    gettestover1 = (teamainnKey[1]) ? teamainnKey[1].equations.overs : 0;
                                    gettestover2 = (teambinnKey[1]) ? teambinnKey[1].equations.overs : 0;
                                }
                                if (!gettestwicket1) {
                                    matchdata.wickets1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0) + ',' + gettestwicket1;
                                }
                                if (!gettestwicket2) {
                                    matchdata.wickets2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0) + ',' + gettestwicket2;
                                }
                                if (!gettestover1) {
                                    matchdata.overs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0) + ',' + gettestover1;
                                }
                                if (!gettestover2) {
                                    matchdata.overs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0) + ',' + gettestover2;
                                }
                                if (!gettestscore1) {
                                    matchdata.runs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0) + ',' + gettestscore1;
                                }
                                if (!gettestscore2) {
                                    matchdata.runs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0) + ',' + gettestscore2;
                                }
                            } else {
                                matchdata.winning_status = 0;
                                matchdata.wickets1 = 0;
                                matchdata.wickets2 = 0;
                                matchdata.overs1 = 0;
                                matchdata.overs2 = 0;
                                matchdata.runs1 = 0;
                                matchdata.runs2 = 0;
                            }

                            const matchRunData = await matchRuns.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(getMatchRuns._id) }, {
                                $set: matchdata
                            }, { new: true });
                            let keyMatchRun = `listMatchesRunModel-${matchkey}`;
                            Redis.setkeydata(keyMatchRun, matchRunData, 60 * 60 * 7);
                        } else {
                            matchdata.matchkey = matchkey;
                            matchdata.teams1 = giveresresult?.teama?.short_name;
                            matchdata.teams2 = giveresresult?.teamb?.short_name;
                            matchdata.winning_status = (giveresresult.result) ? giveresresult.result : 0;
                            if (giveresresult.innings) {
                                if (giveresresult.innings.length > 2) {
                                    for (let [i, value] of giveresresult.innings) {
                                        if (value.batting_team_id == giveresresult.teama.team_id) {
                                            teamainnKey.push(giveresresult.innings[i]);
                                        } else if (value.batting_team_id == giveresresult.teamb.team_id) {
                                            teambinnKey.push(giveresresult.innings[i]);
                                        }
                                    }
                                } else {
                                    let key1 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teama.team_id);
                                    let key2 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teamb.team_id);
                                    if (key1 >= 0) {
                                        teamainnKey.push(giveresresult.innings[key1]);
                                    } else {
                                        teamainnKey.push([]);
                                    }
                                    if (key2 >= 0) {
                                        teambinnKey.push(giveresresult.innings[key2]);
                                    } else {
                                        teambinnKey.push([]);
                                    }
                                }
                                let gettestscore1 = 0;
                                let gettestscore2 = 0;
                                let gettestwicket1 = 0;
                                let gettestwicket2 = 0;
                                let gettestover1 = 0;
                                let gettestover2 = 0;
                                if (teambinnKey[1] && teambinnKey[1]) {
                                    gettestscore2 = (teambinnKey[1]) ? teambinnKey[1].equations.runs : 0;
                                    gettestscore1 = (teamainnKey[1]) ? teamainnKey[1].equations.runs : 0;
                                    gettestwicket1 = (teamainnKey[1]) ? teamainnKey[1].equations.wickets : 0;
                                    gettestwicket2 = (teambinnKey[1]) ? teambinnKey[1].equations.wickets : 0;
                                    gettestover1 = (teamainnKey[1]) ? teamainnKey[1].equations.overs : 0;
                                    gettestover2 = (teambinnKey[1]) ? teambinnKey[1].equations.overs : 0;
                                }
                                if (!gettestwicket1) {
                                    matchdata.wickets1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0) + ',' + gettestwicket1;
                                }
                                if (!gettestwicket2) {
                                    matchdata.wickets2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0) + ',' + gettestwicket2;
                                }
                                if (!gettestover1) {
                                    matchdata.overs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0) + ',' + gettestover1;
                                }
                                if (!gettestover2) {
                                    matchdata.overs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0) + ',' + gettestover2;
                                }
                                if (!gettestscore1) {
                                    matchdata.runs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0) + ',' + gettestscore1;
                                }
                                if (!gettestscore2) {
                                    matchdata.runs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0) + ',' + gettestscore2;
                                }
                            } else {
                                matchdata.winning_status = 0;
                                matchdata.wickets1 = 0;
                                matchdata.wickets2 = 0;
                                matchdata.overs1 = 0;
                                matchdata.overs2 = 0;
                                matchdata.runs1 = 0;
                                matchdata.runs2 = 0;
                            }
                            let matchRunData = await matchRuns.create(matchdata);
                            let keyMatchRun = `listMatchesRunModel-${matchkey}`;
                            Redis.setkeydata(keyMatchRun, matchRunData, 60 * 60 * 7);
                        }
                        let matchStatus = {};
                        let mainArrayGet = giveresresult;
                        //console.log("mainArrayGetasdf"+mainArrayGet.length+"mainArrayGet"+JSON.stringify(mainArrayGet))
                        matchStatus.status = m_status[mainArrayGet.status];
                        if (matchStatus.status == constant.MATCHES_STATUS.COMPLETED && checkmatch.final_status == constant.MATCH_FINAL_STATUS.PENDING) {
                            console.log("b1 matchStatus")
                            matchStatus.final_status = constant.MATCH_FINAL_STATUS.IS_REVIEWED
                        }
                        let updateMatch = await listMatches.findOneAndUpdate({ '_id': mongoose.Types.ObjectId(checkmatch._id) }, {
                            $set: matchStatus
                        }, { new: true });
                        Redis.setkeydata(keyname, updateMatch, 60 * 60 * 4);
                        let playing11 = await this.findMatchPlayers(checkmatch._id, null, 1);

                        if (mainArrayGet.players) {
                            if (mainArrayGet.players.length > 0) {
                                // let matchPlayersData = await this.findMatchPlayers1(checkmatch._id);
                                let matchPlayersData = await this.findMatchPlayers(checkmatch._id);
                                if (matchPlayersData.length > 0) {
                                    let innplayers = [],
                                        t = '',
                                        f = 1,
                                        j = 1;
                                    for (let player of matchPlayersData) {
                                        let pid = player._id;
                                        let p_id = player.playersData._id;
                                        let value = player.playersData.players_key;
                                        let i = 1;
                                        innplayers[value] = [];
                                        innplayers[value][i] = {};
                                        // console.log('teamainnKey',teamainnKey);
                                        // console.log('teambinnKey',teambinnKey);
                                        for (let [ak, teama] of teamainnKey.entries()) {

                                            let datasv = {},
                                                runs = 0,
                                                fours = 0,
                                                six = 0,
                                                duck = 0,
                                                maiden_over = 0,
                                                wicket = 0,
                                                pCatch = 0,
                                                runouts = 0,
                                                stumbed = 0,
                                                batdots = 0,
                                                balldots = 0,
                                                miletone_run = 0,
                                                bball = 0,
                                                grun = 0,
                                                balls = 0,
                                                bballs = 0,
                                                extra = 0,
                                                overs = 0;

                                                
                                            if (teama != '') {
                                                let bat = (teama.batsmen) ? teama.batsmen.findIndex(element => element.batsman_id == value) : "";
                                                
                                                if (bat != -1) {
                                                    // innplayers[value][i]={}; //for test
                                                    innplayers[value][i]['batting'] = teama.batsmen[bat];
                                                } else {
                                                    // innplayers[value][i]={}; //for test
                                                    if (!innplayers[value][i] && !innplayers[value][i]['batting']) {
                                                        console.log("b1 (!")
                                                        innplayers[value][i]['batting'] = '';
                                                    }
                                                    let bowl = (teama != '' && teama.bowlers) ? teama.bowlers.findIndex(element => element.bowler_id == value) : "";
                                                    let field = (teama != '' && teama.fielder) ? teama.fielder.findIndex(element => element.fielder_id == value) : "";

                                                    innplayers[value][i]['bowling'] = (bowl != -1) ? teama.bowlers[bowl] : '';

                                                    innplayers[value][i]['fielding'] = (field != -1) ? teama.fielder[field] : '';
                                                }
                                            }

                                            
                                            if (teambinnKey.length > 0 && teambinnKey[0] != '') {

                                                let batb = (teambinnKey[ak]['batsmen']) ? teambinnKey[ak]['batsmen'].findIndex(element => element.batsman_id == value) : "";
                                                // console.log('teamb batb--->',batb);
                                                if (batb != -1) {
                                                    // innplayers[value][i]={};
                                                    innplayers[value][i]['batting'] = (teambinnKey[ak]['batsmen'][batb]) ? teambinnKey[ak]['batsmen'][batb] : '';

                                                } else {
                                                    // innplayers[value][i]={};
                                                    if (!innplayers[value][i] && !innplayers[value][i]['batting']) {
                                                        console.log("b1 (!")
                                                        innplayers[value][i]['batting'] = '';
                                                    }
                                                   
                                                    if (!innplayers[value][i]['bowling']) {
                                                        let bowlb = (teambinnKey[ak]['bowlers']) ? teambinnKey[ak]['bowlers'].findIndex(element => element.bowler_id == value) : "";
                                                        if (bowlb !== -1) {
                                                            innplayers[value][i]['bowling'] = (teambinnKey[ak]['bowlers'][bowlb]) ? teambinnKey[ak]['bowlers'][bowlb] : '';
                                                        } else {
                                                            innplayers[value][i]['bowling'] = '';
                                                        }
                                                    }
                                                    if (!innplayers[value][i]['fielding']) {
                                                        let fieldb = (teambinnKey[ak]['fielder']) ? teambinnKey[ak]['fielder'].findIndex(element => element.fielder_id == value) : "";
                                                        if (fieldb !== -1) {
                                                            innplayers[value][i]['fielding'] = (teambinnKey[ak]['fielder'][fieldb]) ? teambinnKey[ak]['fielder'][fieldb] : '';
                                                        } else {
                                                            innplayers[value][i]['fielding'] = ''
                                                        }
                                                    }
                                                }
                                            }
                                            let play = innplayers[value][i];
                                            
                                            // console.log('bowling',play['bowling'])
                                            // console.log('fielding',play['fielding'])
                                            if (play['batting'] || play['bowling'] || play['fielding']) {
                                                let checkPlaying11 = playing11.find(element => element.playersData.players_key == value);
                                                if (checkPlaying11) {
                                                    datasv.starting11 = 1;
                                                }
                                                //batting points
                                                if (play['batting']) {
                                                    if (play['batting']['strike_rate']) {
                                                        datasv.batting = 1;
                                                        datasv.strike_rate = play['batting']['strike_rate'];
                                                    } else {
                                                        datasv.batting = 0;
                                                    }
                                                    /* runs points */
                                                    if (play['batting']['runs']) {
                                                        datasv.runs = runs = runs + play['batting']['runs'];
                                                    } else {
                                                        datasv.runs = 0;
                                                    }
                                                    /* fours points */

                                                    if (play['batting']['fours']) {
                                                        datasv.fours = fours = fours + play['batting']['fours'];
                                                    }
                                                    if (play['batting']['balls_faced']) {
                                                        datasv.bball = bball = bball + play['batting']['balls_faced'];
                                                    }
                                                    /* sixes Points */

                                                    if (play['batting']['sixes']) {
                                                        datasv.six = six = six + play['batting']['sixes'];
                                                    }
                                                    if (play['batting']['dismissal']) {

                                                        if (player.playersData.role != 'bowler') {
                                                            if ((runs == 0) && (play['batting']['dismissal'] != '')) {
                                                                console.log("b1 ((")
                                                                datasv.duck = duck = 1;
                                                            } else {
                                                                datasv.duck = duck = 0;
                                                            }
                                                        } else {
                                                            datasv.duck = duck = 0;
                                                        }
                                                        if (play['batting']['dismissal'] != '') {
                                                            datasv.out_str = play['batting']['how_out'];
                                                        } else {
                                                            datasv.out_str = 'not out';
                                                        }
                                                    }
                                                    if (play['batting']['dots']) {
                                                        datasv.battingdots = batdots = batdots + play['batting']['run0'];
                                                    }

                                                    if (play['batting']['dismissal'] == 'lbw' || play['batting']['dismissal'] == 'bowled') {
                                                        console.log("b1 play------------>")
                                                        let wbowlerkey = play['batting']['bowler_id'];

                                                        let bowlerplayersid = await this.findMatchPlayers(checkmatch._id, wbowlerkey);
                                                        if (bowlerplayersid[0]) {
                                                            datasv.wplayerid = bowlerplayersid[0].playerid;
                                                        }
                                                    }
                                                    datasv['wicket_type'] = (play['batting']['dismissal']) ? play['batting']['dismissal'] : '';
                                                }
                                               
                                                //Bowling points
                                                if (play['bowling']) {
                                                    let bowling = play['bowling'];
                                                    datasv.bowling = 1;
                                                    datasv.economy_rate = bowling['econ'];
                                                    datasv.maiden_over = maiden_over = maiden_over + (bowling['maidens'] ? bowling['maidens'] : 0);
                                                    datasv.wicket = wicket = wicket + (bowling['wickets'] ? bowling['wickets'] : 0);
                                                    datasv.overs = overs = overs + (bowling['overs'] ? bowling['overs'] : 0);
                                                    datasv.grun = grun = grun + (bowling['runs_conceded'] ? bowling['runs_conceded'] : 0);
                                                    datasv.balldots = balldots = balldots + (bowling['run0'] ? bowling['run0'] : 0);
                                                    datasv.balls = balls = balls + (overs ? overs * 6 : 0);
                                                    if (bowling['noballs']) {
                                                        datasv.extra = extra = extra + (bowling['noballs'] + bowling['wides']);
                                                    }

                                                }

                                                // fielding points //
                                                if (play['fielding'] != '' && play['fielding'] != undefined) {
                                                    console.log("b1 play")
                                                    let fielding = play['fielding'];
                                                    datasv.catch = pCatch = pCatch + (fielding['catches']) ? fielding['catches'] : 0;
                                                    if (fielding['runout_direct_hit'] == 0) { //console.log("b1 fielding")
                                                        datasv.hitter = fielding['runout_catcher'];
                                                        datasv.thrower = fielding['runout_thrower'];
                                                    } else {
                                                        datasv.thrower = 1;
                                                        datasv.hitter = 1;
                                                    }
                                                    datasv.stumbed = stumbed = stumbed + (fielding['stumping'] ? fielding['stumping'] : 0);
                                                } else {
                                                    datasv.thrower = 0;
                                                    datasv.hitter = 0;
                                                }
                                                datasv.matchkey = mongoose.Types.ObjectId(checkmatch._id);
                                                datasv.player_key = value;
                                                datasv.player_id = p_id;
                                                datasv.innings = i;
                                                console.log('datasv--->',datasv);
                                                let findResult = await resultMatch.findOne({ matchkey: mongoose.Types.ObjectId(checkmatch._id), player_key: value, innings: i });

                                                if (findResult) {
                                                    await resultMatch.updateOne({ _id: mongoose.Types.ObjectId(findResult._id) }, {
                                                        $set: datasv
                                                    });
                                                } else {
                                                    await resultMatch.create(datasv);
                                                }
                                            }
                                            i++;
                                        }
                                    }

                                    let matchPlayers = await this.playerPoint(checkmatch._id, checkmatch.format);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log("error" + error)
        }
    }
    async playerPoint(matchid, format) {
        let findResultMatches = await resultMatch.find({ matchkey: mongoose.Types.ObjectId(matchid) });
        if (findResultMatches.length > 0) {
            for (let row of findResultMatches) {
                let resultmatchupdate = [],
                    result = {},
                    resultpoints = {};
                let duck = row.duck,
                    player_key = row.player_key,
                    runs = row.runs,
                    wicket = row.wicket,
                    pCatch = row.catch,
                    stumbed = row.stumbed,
                    boundary = row.boundary,
                    six = row.six,
                    fours = row.fours,
                    maiden_over = row.maiden_over,
                    thrower = row.thrower,
                    hitter = row.hitter,
                    overs = row.overs,
                    bballs = row.bball,
                    erate = row.economy_rate,
                    strikerate = row.strike_rate,
                    extra_points = row.extra_points,
                    wicket_type = row.wicket_type,
                    wplayerid = row.wplayerid,
                    startingpoint = 0,
                    throwpoint = 0,
                    hittspoints = 0,
                    duckpoint = 0,
                    wkpoints = 0,
                    catchpoint = 0,
                    stpoint = 0,
                    boundrypoints = 0,
                    sixpoints = 0,
                    runpoints = 0,
                    centuryPoints = 0,
                    halcenturypoints = 0,
                    maidenpoints = 0,
                    total_points = 0,
                    economypoints = 0,
                    strikePoint = 0,
                    batting_points = 0,
                    bowling_points = 0,
                    thirtypoints = 0,
                    fielding_points = 0,
                    lbw_bowled_bonus = row.lbw_bowled_bonus,
                    wicketbonuspoint = 0;
                //sahil redis


                let keyname = `matchkey-${matchid}-playerid-${row.player_id}`;
                let redisdata = await Redis.getkeydata(keyname);
                let findplayerrole;
                if (redisdata) {
                    findplayerrole = redisdata;
                }
                else {
                    findplayerrole = await matchPlayers.findOne({ playerid: mongoose.Types.ObjectId(row.player_id), matchkey: mongoose.Types.ObjectId(matchid) });
                    let redisdataa = Redis.setkeydata(keyname, findplayerrole, 60 * 60 * 4);

                }

                //sahil redis end
                //comment for redis--> let findplayerrole = await matchPlayers.findOne({ playerid: mongoose.Types.ObjectId(row.player_id), matchkey: mongoose.Types.ObjectId(matchid) });

                let wicketbonuspointdata = await resultMatch.find({ matchkey: mongoose.Types.ObjectId(matchid), wplayerid: mongoose.Types.ObjectId(row.player_id) });

                if (wicketbonuspointdata.length > 0) {
                    wicketbonuspoint = wicketbonuspointdata.length * 8;

                    if (lbw_bowled_bonus != undefined && (lbw_bowled_bonus)) {
                        wicketbonuspoint = wicketbonuspoint + lbw_bowled_bonus;
                    }
                }
                // console.log('wicketbonuspoint',wicketbonuspoint)
                if (format == 't20') {
                    startingpoint = (row.starting11 == 1 && row.innings == 1) ? 4 : 0;
                    // batting points given //
                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        duckpoint = (row.duck != 0) ? -2 : 0;
                    }
                    boundrypoints = fours * 1;
                    sixpoints = six * 2;

                    runpoints = runs * 1;
                    if ((runs >= 50) && (runs < 100)) {
                        halcenturypoints = 8;
                    } else if ((runs >= 30) && (runs < 50)) {
                        thirtypoints = 4;
                    } else if (runs >= 100) {
                        centuryPoints = 16;
                    }
                    extra_points = extra_points * 1;
                    if (wicket == 3) {
                        wkpoints = wkpoints + 4;
                    }
                    if (wicket == 4) {
                        wkpoints = wkpoints + 8;
                    }
                    if (wicket >= 5) {
                        wkpoints = wkpoints + 16;
                    }
                    wkpoints = wkpoints + wicket * 25;
                    maidenpoints = maiden_over * 12;

                    // fielding points //
                    if (pCatch >= 3) {
                        catchpoint = catchpoint + 4;
                    }
                    catchpoint = catchpoint + pCatch * 8;
                    stpoint = stumbed * 12;
                    throwpoint = thrower * 6;
                    hittspoints = hitter * 6;
                    if (overs >= 2) {
                        if (erate < 5) {
                            economypoints = 6;
                        } else if (erate >= 5 && erate <= 5.99) {
                            economypoints = 4;
                        } else if (erate >= 6 && erate <= 7) {
                            economypoints = 2;
                        } else if (erate >= 10 && erate <= 11) {
                            economypoints = -2;
                        } else if (erate >= 11.1 && erate <= 12) {
                            economypoints = -4;
                        } else if (erate >= 12) {
                            economypoints = -6;
                        }
                    }
                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        if (bballs >= 10) {

                            if (strikerate >= 130 && strikerate <= 150) {
                                strikePoint = 2;
                            } else if (strikerate >= 150.1 && strikerate <= 170) {
                                strikePoint = 4;
                            } else if (strikerate > 170) {
                                strikePoint = 6;
                            } else if (strikerate >= 60 && strikerate <= 70) {
                                strikePoint = -2;
                            } else if (strikerate >= 50 && strikerate <= 59.9) {
                                strikePoint = -4;
                            } else if (strikerate < 50) {
                                strikePoint = -6;
                            }

                        }
                    }
                } else if (format == 't10') {
                    startingpoint = (row.starting11 == 1 && row.innings == 1) ? 4 : 0;
                    // batting points given //
                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        duckpoint = (row.duck != 0) ? -2 : 0;
                    }
                    boundrypoints = fours * 1;
                    sixpoints = six * 2;

                    runpoints = runs * 1;
                    if ((runs >= 30) && (runs < 50)) {
                        halcenturypoints = 8;
                    } else if (runs >= 50) {
                        centuryPoints = 16;
                    }
                    extra_points = extra_points * 1;
                    // give points for bowling //
                    if (wicket == 2) {
                        wkpoints = wkpoints + 8;
                    }
                    if (wicket >= 3) {
                        wkpoints = wkpoints + 16;
                    }
                    wkpoints = wkpoints + wicket * 25;
                    maidenpoints = maiden_over * 16;

                    // fielding points //

                    if (pCatch >= 3) {
                        catchpoint = catchpoint + 4;
                    }
                    catchpoint = catchpoint + pCatch * 8;
                    stpoint = stumbed * 12;
                    throwpoint = thrower * 6;
                    hittspoints = hitter * 6;
                    if (overs >= 1) {
                        if (erate < 7) {
                            economypoints = 6;
                        } else if (erate >= 7 && erate <= 7.99) {
                            economypoints = 4;
                        } else if (erate >= 8 && erate <= 9) {
                            economypoints = 2;
                        } else if (erate >= 14 && erate <= 15) {
                            economypoints = -2;
                        } else if (erate >= 15.1 && erate <= 16) {
                            economypoints = -4;
                        } else if (erate >= 16) {
                            economypoints = -6;
                        }
                    }
                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        if (bballs >= 5) {
                            if (strikerate >= 150 && strikerate <= 170) {
                                strikePoint = 2;
                            } else if (strikerate >= 170.1 && strikerate <= 190) {
                                strikePoint = 4;
                            } else if (strikerate > 190) {
                                strikePoint = 6;
                            } else if (strikerate >= 70 && strikerate <= 80) {
                                strikePoint = -2;
                            } else if (strikerate >= 60 && strikerate <= 69.99) {
                                strikePoint = -4;
                            } else if (strikerate < 60) {
                                strikePoint = -6;
                            }
                        }
                    }
                } else if (format == 'one-day') {
                    startingpoint = (row.starting11 == 1 && row.innings == 1) ? 4 : 0;
                    // batting points given //
                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        duckpoint = (row.duck != 0) ? -3 : 0;
                    }
                    boundrypoints = fours * 1;
                    sixpoints = six * 2;
                    runpoints = runs * 1;
                    if ((runs >= 50) && (runs < 100)) {
                        halcenturypoints = 4;
                    } else if (runs >= 100) {
                        centuryPoints = 8;
                    }
                    extra_points = extra_points * 1;
                    // give points for bowling //
                    if (wicket == 4) {
                        wkpoints = wkpoints + 4;
                    }
                    if (wicket >= 5) {
                        wkpoints = wkpoints + 8;
                    }
                    wkpoints = wkpoints + wicket * 25;
                    maidenpoints = maiden_over * 4;

                    // fielding points //
                    if (pCatch >= 3) {
                        catchpoint = catchpoint + 4;
                    }
                    catchpoint = catchpoint + pCatch * 8;

                    stpoint = stumbed * 12;
                    throwpoint = thrower * 6;
                    hittspoints = hitter * 6;
                    if (overs >= 5) {
                        if (erate < 2.5) {
                            economypoints = 6;
                        } else if (erate >= 2.5 && erate <= 3.49) {
                            economypoints = 4;
                        } else if (erate >= 3.5 && erate <= 4.5) {
                            economypoints = 2;
                        } else if (erate >= 7 && erate <= 8) {
                            economypoints = -2;
                        } else if (erate >= 8.1 && erate <= 9) {
                            economypoints = -4;
                        } else if (erate >= 9) {
                            economypoints = -6;
                        }
                    }

                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        if (bballs >= 20) {
                            if (strikerate >= 100 && strikerate <= 120) {
                                strikePoint = 2;
                            } else if (strikerate >= 120.1 && strikerate <= 140) {
                                strikePoint = 4;
                            } else if (strikerate > 140) {
                                strikePoint = 6;
                            } else if (strikerate >= 40 && strikerate <= 50) {
                                strikePoint = -2;
                            } else if (strikerate >= 30 && strikerate <= 39.9) {
                                strikePoint = -4;
                            } else if (strikerate < 30) {
                                strikePoint = -6;
                            }

                        }

                    }
                } else {

                    startingpoint = (row.starting11 == 1 && row.innings == 1) ? 4 : 0;
                    // batting points given //
                    if (findplayerrole && findplayerrole.role != constant.ROLE.BOWL) {
                        duckpoint = (row.duck != 0) ? -4 : 0;
                    }
                    boundrypoints = fours * 1;
                    sixpoints = six * 2;
                    runpoints = runs * 1;
                    if ((runs >= 50) && (runs < 100)) {
                        halcenturypoints = 4;
                    } else if (runs >= 100) {
                        centuryPoints = 8;
                    }
                    extra_points = extra_points * 1;
                    // give points for bowling //
                    if (wicket == 4) {
                        wkpoints = wkpoints + 4;
                    }
                    if (wicket >= 5) {
                        wkpoints = wkpoints + 8;
                    }
                    wkpoints = wkpoints + wicket * 16;

                    // fielding points //

                    catchpoint = pCatch * 8;
                    stpoint = stumbed * 12;
                    throwpoint = thrower * 6;
                    hittspoints = hitter * 6;
                }
                if (row.starting11 == 1) {
                    result.batting_points = runpoints + sixpoints + boundrypoints + strikePoint + halcenturypoints + centuryPoints + thirtypoints;
                    result.fielding_points = catchpoint + stpoint + throwpoint + hittspoints;
                    result.bowling_points = wkpoints + maidenpoints + economypoints + wicketbonuspoint;
                    total_points = result.total_points = startingpoint + runpoints + sixpoints + halcenturypoints + centuryPoints + boundrypoints + strikePoint + catchpoint + stpoint + wkpoints + maidenpoints + economypoints + duckpoint + hittspoints + throwpoint + wicketbonuspoint + thirtypoints;
                } else {
                    result.batting_points = 0;
                    result.fielding_points = 0;
                    result.bowling_points = 0;
                    total_points = result.total_points = 0;
                }
                await resultMatch.updateOne({ _id: mongoose.Types.ObjectId(row._id) }, {
                    $set: result
                });
                resultpoints['matchkey'] = mongoose.Types.ObjectId(matchid);
                resultpoints['player_id'] = mongoose.Types.ObjectId(row.player_id);
                if (row.starting11 == 1) {
                    resultpoints['startingpoints'] = startingpoint;
                    resultpoints['runs'] = runpoints;
                    resultpoints['fours'] = boundrypoints;
                    resultpoints['sixs'] = sixpoints;
                    resultpoints['strike_rate'] = strikePoint;
                    resultpoints['halfcentury'] = halcenturypoints;
                    resultpoints['century'] = centuryPoints;
                    resultpoints['wickets'] = wkpoints;
                    resultpoints['maidens'] = maidenpoints;
                    resultpoints['economy_rate'] = economypoints;
                    resultpoints['catch'] = catchpoint;
                    resultpoints['stumping'] = stpoint;
                    resultpoints['thrower'] = throwpoint;
                    resultpoints['hitter'] = hittspoints;
                    resultpoints['stumping'] = stpoint;
                    resultpoints['negative'] = duckpoint;
                    resultpoints['thirtypoints'] = thirtypoints;
                    resultpoints['wicketbonuspoint'] = wicketbonuspoint;
                    resultpoints['total'] = total_points;
                } else {
                    resultpoints['startingpoints'] = 0;
                    resultpoints['runs'] = 0;
                    resultpoints['fours'] = 0;
                    resultpoints['sixs'] = 0;
                    resultpoints['strike_rate'] = 0;
                    resultpoints['halfcentury'] = 0;
                    resultpoints['century'] = 0;
                    resultpoints['wickets'] = 0;
                    resultpoints['maidens'] = 0;
                    resultpoints['economy_rate'] = 0;
                    resultpoints['catch'] = 0;
                    resultpoints['stumping'] = 0;
                    resultpoints['negative'] = 0;
                    resultpoints['wicketbonuspoint'] = 0;
                    resultpoints['thirtypoints'] = 0;
                    resultpoints['total'] = 0;
                }
                // console.log('resultpoints',resultpoints);
                let pointsData = await resultPoint.findOne({ matchkey: mongoose.Types.ObjectId(matchid), resultmatch_id: mongoose.Types.ObjectId(row._id), playerid: mongoose.Types.ObjectId(row.player_id) });
                // console.log("--------------------------pointsData-------------------------",pointsData)

                if (pointsData) {

                    await resultPoint.updateOne({ _id: mongoose.Types.ObjectId(pointsData._id) }, {
                        $set: resultpoints
                    });
                } else {

                    resultpoints['resultmatch_id'] = row._id;
                    await resultPoint.create(resultpoints);
                }
            }
        }
        await this.updatePlayerPoints(matchid);
    }
    async updatePlayerPoints(matchid) {
        let pipeline = [];
        // console.log("-------------------------------------updatePlayerPoints---------------------matchid----",matchid)
        pipeline.push({
            $match: { matchkey: mongoose.Types.ObjectId(matchid) }
        })
        pipeline.push({
            $lookup: {
                from: 'resultpoints',
                let: { player_id: "$playerid", matchkey: "$matchkey" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$player_id", "$$player_id"] },
                                    { $eq: ["$matchkey", "$$matchkey"] },

                                ],
                            },
                        },
                    },
                ],
                as: 'resultPointData'
            }
        })
        pipeline.push({
            $unwind: { path: "$resultPointData" }
        })
        pipeline.push({
            $group: {
                _id: '$_id',
                total: {
                    $sum: "$resultPointData.total"
                }
            }
        });

        let getMatchPlayers = await matchPlayers.aggregate(pipeline);
        if (getMatchPlayers.length > 0) {
            for (let players of getMatchPlayers) {
                let redismatches = await matchPlayers.find({ '_id': mongoose.Types.ObjectId(players._id) })
                for (let redisdataa of redismatches) {
                    let keyname = `matchkey-${matchid}-playerid-${redisdataa.playerid}`
                    let redisdata = await Redis.getkeydata(keyname);
                    if (redisdata) {
                        redisdata["points"] = players.total;

                        let redisdataa = Redis.setkeydata(keyname, redisdata, 60 * 60 * 4);

                    }
                }
                await matchPlayers.updateOne({ _id: mongoose.Types.ObjectId(players._id) }, {
                    $set: {
                        points: players.total
                    }
                });
            }
        }
        //await this.userpoints(matchid);
    }
    async userpoints(matchid) {
        let joinTeamList = await joinTeam.find({ matchkey: mongoose.Types.ObjectId(matchid) });
        let allMatchPlayers = await this.findMatchPlayers(matchid);
        if (joinTeamList.length > 0) {
            for (let team of joinTeamList) {
                let result = {};
                let user_points = 0;
                let players = team.players;
                // console.log("--players-->>>>>>>>>-",players);
                for (let player of allMatchPlayers) {
                    //pid - matchplayerid ,p_id= playerid
                    let pid = player.playerid;
                    // element.toString() === pid.toString()

                    let findPlayer = await players.find(element => element.toString() === pid.toString());
                    if (findPlayer && findPlayer != '') {
                        if (team.captain.toString() == pid.toString()) {
                            user_points = user_points + (player.points * 2);
                        } else if (team.vicecaptain.toString() === pid.toString()) {
                            user_points = user_points + (player.points * 1.5);
                        } else {
                            user_points = user_points + player.points;
                        }
                    } else {
                        user_points = user_points;
                    }
                }

                if (team.points != user_points) {
                    result['lastpoints'] = team.points;
                }
                result['points'] = user_points;

                let updatrepoints = await joinTeam.updateOne({ _id: mongoose.Types.ObjectId(team._id) }, {
                    $set: result
                });
            }
        }
    }


    async refundAmount() {
        console.log("-------------------------------------refundAmount-------------------------")
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        let match_time = moment().add(10, 'm').format('YYYY-MM-DD HH:mm:ss');

        let pipeline = [];
        pipeline.push({
            $match: {
                // _id:mongoose.Types.ObjectId('63fd749179494aff832d5325'),
                // fantasy_type: "Cricket",
                // start_date: { $lte: match_time },
                launch_status: 'launched',
                final_status: { $nin: ["winnerdeclared", "IsCanceled"] }
            }
        });
        // --------------
        let today = new Date();
        today.setHours(today.getHours() + 5);
        today.setMinutes(today.getMinutes() + 30);
        console.log("--today----", today)
        // let lastDate = today.setMinutes(today.getMinutes() + 10);
        // console.log("--today-+10---",today)
        pipeline.push({
            $addFields: {
                date: {
                    $dateFromString: {
                        dateString: '$start_date',
                        timezone: "-00:00"
                    }
                },
                curDate: today
            }
        });
        pipeline.push({
            $match: {
                $expr: {
                    $and: [{
                        $lte: ['$date', '$curDate'],
                    },
                        // {
                        //     $lte: ['$date',lastDate ],
                        // },
                    ],
                },
            }
        });
        // --------------
        pipeline.push({
            $lookup: {
                from: 'matchchallenges',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        status: { $ne: "canceled" },
                        $expr: {
                            $and: [
                                { $eq: ["$matchkey", "$$matckey"] },
                            ],
                        },
                    },
                },],
                as: 'matchChallengesData'
            }
        })
        let listmatches = await listMatches.aggregate(pipeline);
        console.log("--listmatches---", listmatches)
        if (listmatches.length > 0) {
            for (let match of listmatches) {

                if (match.matchChallengesData.length > 0) {
                    for (let value1 of match.matchChallengesData) {
                        let data = {};
                        if (value1.maximum_user > value1.joinedusers) {
                            if (value1.confirmed_challenge == 0) {
                                let getresponse = await this.refundprocess(value1._id, value1.entryfee, match._id, 'challenge cancel');
                                if (getresponse == true) {
                                    await matchChallenge.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                                        $set: {
                                            status: 'canceled'
                                        }
                                    });
                                }
                            }
                        }
                        if (value1.pricecard_type == 'Percentage') {
                            let joinedUsers = await joinLeague.find({
                                matchkey: mongoose.Types.ObjectId(match.matchkey),
                                challengeid: mongoose.Types.ObjectId(value1._id),
                            }).count();
                            if (value1.confirmed_challenge == 1 && joinedUsers == 1) {
                                let getresponse = await this.refundprocess(value1._id, value1.entryfee, match.matchkey, 'challenge cancel');
                                if (getresponse == true) {
                                    data['status'] = 'canceled';
                                    await matchChallenge.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                                        $set: {
                                            status: 'canceled'
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    }
    async refundprocess(challengeid, entryfee, matchkey, reason) {
        console.log("-------------------------------------refundprocess-----------------------------")
        let joinLeagues = await joinLeague.find({
            matchkey: mongoose.Types.ObjectId(matchkey),
            challengeid: mongoose.Types.ObjectId(challengeid),
        });
        if (joinLeagues.length > 0) {
            for (let league of joinLeagues) {
                let leaugestransaction = league.leaugestransaction;
                let refund_data = await refundMatch.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                if (!refund_data) {
                    const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                    if (user) {
                        const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                        const balance = parseFloat(user.userbalance.balance.toFixed(2));
                        const winning = parseFloat(user.userbalance.winning.toFixed(2));
                        const totalBalance = bonus + balance + winning;
                        const userObj = {
                            'userbalance.balance': balance + leaugestransaction.balance,
                            'userbalance.bonus': bonus + leaugestransaction.bonus,
                            'userbalance.winning': winning + leaugestransaction.winning,
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        console.log("------randomStr-------2", randomStr)
                        let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                        let refundData = {
                            userid: leaugestransaction.user_id,
                            amount: entryfee,
                            joinid: league._id,
                            challengeid: league.challengeid,
                            matchkey: matchkey,
                            reason: reason,
                            transaction_id: transaction_id
                        };
                        const transactiondata = {
                            type: 'Refund',
                            amount: entryfee,
                            total_available_amt: totalBalance + entryfee,
                            transaction_by: constant.APP_SHORT_NAME,
                            challengeid: challengeid,
                            userid: leaugestransaction.user_id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus + leaugestransaction.bonus,
                            bal_win_amt: winning + leaugestransaction.winning,
                            bal_fund_amt: balance + leaugestransaction.balance,
                            bonus_amt: leaugestransaction.bonus,
                            win_amt: leaugestransaction.winning,
                            addfund_amt: leaugestransaction.balance,
                            transaction_id: transaction_id
                        };
                        console.log("----refundprocess----transactiondata----", transactiondata)
                        console.log("----refundprocess----refundData----", refundData)
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                            refundMatch.create(refundData),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                }
            }
        }
        return true;
    }
    async distributeWinningAmount(req) {
        console.log("-------------------------------------distributeWinningAmount------------------------------")
        let { id, status } = req.params;
        let matchkey = id;
        let match_time = moment().subtract(10, 'm').format('YYYY-MM-DD HH:mm:ss');
        let pipeline = [];
        pipeline.push({
            $match: {
                _id: mongoose.Types.ObjectId(matchkey),
                launch_status: 'launched',
                final_status: { $nin: ["winnerdeclared", "IsCanceled", "IsAbandoned"] }
            }
        });
        pipeline.push({
            $lookup: {
                from: 'matchchallenges',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        status: { $ne: "canceled" },
                        // _id:mongoose.Types.ObjectId("628b08fd250227be46ae4374"),
                        $expr: {
                            $and: [
                                { $eq: ["$matchkey", "$$matckey"] },
                            ],
                        },
                    },
                },],
                as: 'matchChallengesData'
            }
        })
        let listmatches = await listMatches.aggregate(pipeline);
        console.log(listmatches)
        if (listmatches.length > 0) {
            for (let challenge of listmatches[0].matchChallengesData) {
                let pipeline1 = [];
                pipeline1.push({
                    $match: {
                        matchkey: mongoose.Types.ObjectId(listmatches[0]._id),
                        challengeid: mongoose.Types.ObjectId(challenge._id)
                    }
                });
                pipeline1.push({
                    $lookup: {
                        from: "leaderboards",
                        localField: "_id",
                        foreignField: "joinId",
                        as: 'joinTeamData'
                    }
                });
                pipeline1.push({
                    $unwind: {
                        path: "$joinTeamData"
                    }
                });
                pipeline1.push({
                    $project: {
                        _id: 1,
                        "points": "$joinTeamData.points",
                        userid: 1
                    }
                });
                let joinedusers = await joinLeague.aggregate(pipeline1);
                console.log("-------joinedusers-------->--", joinedusers.length)
                if (joinedusers.length > 0) {
                    let prc_arr = [];
                    if (challenge.contest_type == 'Amount') {
                        if (challenge.pricecard_type == 'Amount') {
                            // console.log('challenge.matchpricecards',challenge.matchpricecards)
                            if (challenge.amount_type == 'prize') {
                                if (challenge.matchpricecards.length > 0) {
                                    for await (let prccrd of challenge.matchpricecards) {
                                        let min_position = prccrd.min_position;
                                        let max_position = prccrd.max_position;
                                        for (let i = min_position; i < max_position; i++) {
                                            let Obj = {};
                                            Obj['gift_type'] = prccrd.gift_type ? prccrd.gift_type : "amount"
                                            if (Obj['gift_type'] == "gift") {
                                                Obj['price'] = prccrd.prize_name;
                                            } else {
                                                Obj['price'] = prccrd.price;
                                            }
                                            prc_arr.push(Obj)
                                        }
                                    }
                                } else {
                                    let Obj = {};
                                    Obj['price'] = challenge.win_amount;
                                    Obj['gift_type'] = "amount";
                                    prc_arr.push(Obj)
                                }

                            } else {
                                if (challenge.matchpricecards.length > 0) {
                                    for await (let prccrd of challenge.matchpricecards) {
                                        let min_position = prccrd.min_position;
                                        let max_position = prccrd.max_position;
                                        for (let i = min_position; i < max_position; i++) {
                                            let Obj = {};
                                            Obj['price'] = prccrd.price;
                                            Obj['gift_type'] = "amount";
                                            prc_arr.push(Obj)
                                        }
                                    }
                                } else {
                                    let Obj = {};
                                    Obj['price'] = challenge.win_amount;
                                    Obj['gift_type'] = "amount";
                                    prc_arr.push(Obj)
                                }
                            }
                        } else {
                            if (challenge.matchpricecards.length > 0) {
                                for await (let prccrd of challenge.matchpricecards) {
                                    let min_position = prccrd.min_position;
                                    let max_position = prccrd.max_position;
                                    for (let i = min_position; i < max_position; i++) {
                                        let Obj = {};
                                        Obj['price'] = (prccrd.price_percent / 100) * (challenge.win_amount);
                                        Obj['gift_type'] = prccrd.gift_type ? prccrd.gift_type : "amount";
                                        prc_arr.push(Obj)
                                    }
                                }
                            } else {
                                let Obj = {};
                                Obj['price'] = challenge.win_amount;
                                Obj['gift_type'] = "amount";
                                prc_arr.push(Obj)
                            }
                        }
                    } else if (challenge.contest_type == 'Percentage') {
                        let getwinningpercentage = challenge.winning_percentage;
                        let gtjnusers = challenge.joinedusers;
                        let toWin = Math.floor(gtjnusers * getwinningpercentage / 100);
                        prc_arr = [];
                        for (let i = 0; i < toWin; i++) {
                            let Obj = {};
                            Obj['price'] = challenge.win_amount;
                            Obj['gift_type'] = "amount";
                            prc_arr.push(Obj)
                        }
                    }
                    let user_points = [];
                    if (joinedusers.length > 0) {
                        let lp = 0;
                        for await (let jntm of joinedusers) {
                            user_points[lp] = {};
                            user_points[lp]['id'] = jntm.userid.toString();
                            user_points[lp]['points'] = jntm.points;
                            user_points[lp]['joinedid'] = jntm._id.toString();
                            lp++;
                        }
                    }

                    user_points.sort((a, b) => {
                        return b.points - a.points;
                    });
                    // console.log("=============user_points==========",user_points)
                    let poin_user = [];
                    let ids_str = "";
                    let userids_str = "";
                    for (let usr of user_points) {
                        let indexings = poin_user.findIndex(element => element.points == usr.points);
                        if (indexings == -1) {
                            poin_user.push({
                                id: [usr.id],
                                points: usr.points,
                                joinedid: [usr.joinedid]
                            });
                        } else {
                            let ids_arr = [];
                            let userids_arr = [];
                            let getdatatype = Array.isArray(poin_user[indexings].joinedid);
                            if (getdatatype) {
                                ids_arr = [];
                                userids_arr = [];
                                ids_str = poin_user[indexings].joinedid.join(',');
                                ids_str = ids_str + ',' + usr.joinedid;
                                ids_arr = ids_str.split(',');
                                userids_str = poin_user[indexings].id.join(',');
                                userids_str = userids_str + ',' + usr.id;
                                userids_arr = userids_str.split(',');
                                poin_user[indexings].joinedid = ids_arr;
                                poin_user[indexings].id = userids_arr;
                                poin_user[indexings].points = usr.points;
                            } else {
                                ids_arr = [];
                                userids_arr = [];
                                ids_str = poin_user[indexings].joinedid;
                                ids_str = ids_str + ',' + usr.joinedid;
                                ids_arr = ids_str.split(',');
                                userids_str = poin_user[indexings].id;
                                userids_str = userids_str + ',' + usr.id;
                                userids_arr = userids_str.split(',');
                                poin_user[indexings].joinedid = ids_arr;
                                poin_user[indexings].id = userids_arr;
                                poin_user[indexings].points = usr.points;
                            }
                        }
                    }


                    poin_user.sort((a, b) => {
                        return b.points - a.points;
                    });

                    let win_usr = [];
                    let win_cnt = 0;
                    let count = prc_arr.length;
                    for (let [k, pu] of poin_user.entries()) {
                        if (win_cnt < count) {
                            // let obj1 = {};
                            win_usr[k] = {};
                            win_usr[k]['min'] = win_cnt + 1;
                            win_cnt = win_cnt + pu['joinedid'].length;
                            win_usr[k]['max'] = win_cnt;
                            win_usr[k]['count'] = pu['joinedid'].length;
                            win_usr[k]['joinedid'] = pu['joinedid'];
                            win_usr[k]['id'] = pu['id'];
                            win_usr[k]['points'] = pu['points'];
                        } else {
                            break;
                        }
                    }
                    //    console.log("---prc_arr------->>>",prc_arr);
                    let final_poin_user = [];
                    for (let [ks, ps] of win_usr.entries()) {
                        let num = ps['min'] - 1;
                        let lnum = ps['max'] - 1;
                        if (prc_arr[num]) {
                            if (ps['count'] == 1) {
                                let obj2 = {};

                                obj2[ps['joinedid'][0]] = {};
                                obj2[ps['joinedid'][0]]['points'] = ps['points'];
                                obj2[ps['joinedid'][0]]['amount'] = prc_arr[num]['price'];
                                obj2[ps['joinedid'][0]]['gift_type'] = prc_arr[num]['gift_type'];
                                obj2[ps['joinedid'][0]]['rank'] = num + 1;
                                obj2[ps['joinedid'][0]]['userid'] = ps['id'][0];
                                final_poin_user.push(obj2);
                                // console.log('win_usr final_poin_user' , final_poin_user);
                            } else {
                                let ttl = 0;
                                let avg_ttl = 0;
                                for (let jj = num; jj <= lnum; jj++) {
                                    let sm = 0;
                                    if (prc_arr[jj]) {
                                        if (prc_arr[jj]['gift_type'] != "prize") {
                                            sm = prc_arr[jj]['price'];
                                        }
                                    }
                                    ttl = ttl + sm;
                                }
                                avg_ttl = ttl / ps['count'];

                                for (let [keyuser, fnl] of ps['joinedid'].entries()) {
                                    let obj3 = {};

                                    obj3[fnl] = {};
                                    obj3[fnl]['points'] = ps['points'];
                                    obj3[fnl]['amount'] = avg_ttl;
                                    // obj2[fnl['gift_type'] = prc_arr[ps['min']]['gift_type']
                                    obj3[fnl]['rank'] = ps['min'];
                                    obj3[fnl]['gift_type'] = prc_arr[num]['gift_type'];
                                    obj3[fnl]['userid'] = ps['id'][keyuser];
                                    final_poin_user.push(obj3);
                                }
                            }
                        }
                    }

                    if (final_poin_user.length > 0) {
                        for (let finalPoints of final_poin_user) {
                            let fpusv = Object.values(finalPoints)[0];
                            let fpuskjoinid = Object.keys(finalPoints)[0];
                            let fpusk = fpusv['userid'];
                            let checkWinning = await finalResultModel.findOne({ joinedid: mongoose.Types.ObjectId(fpuskjoinid) });
                            if (!checkWinning) {
                                let randomStr = randomstring.generate({
                                    length: 4,
                                    charset: 'alphabetic',
                                    capitalization: 'uppercase'
                                });
                                // console.log("------randomStr-------", randomStr)
                                let transactionidsave = `${constant.APP_SHORT_NAME}-WIN-${Date.now()}-${randomStr}`;

                                let finalResultArr;
                                if (fpusv['gift_type'] == "gift") {
                                    finalResultArr = {
                                        userid: fpusk,
                                        points: fpusv['points'],
                                        amount: 0,
                                        prize: fpusv['amount'],
                                        rank: fpusv['rank'],
                                        matchkey: matchkey,
                                        challengeid: challenge._id,
                                        seriesid: listmatches[0].series,
                                        transaction_id: transactionidsave,
                                        joinedid: fpuskjoinid
                                    };
                                } else {
                                    finalResultArr = {
                                        userid: fpusk,
                                        points: fpusv['points'],
                                        amount: fpusv['amount'],
                                        rank: fpusv['rank'],
                                        matchkey: matchkey,
                                        challengeid: challenge._id,
                                        seriesid: listmatches[0].series,
                                        transaction_id: transactionidsave,
                                        joinedid: fpuskjoinid
                                    };
                                }
                                // if(challenge.amount_type=='price')
                                // {
                                //     finalResultArr.amount = fpusv['amount'].toFixed(2);
                                //     finalResultArr.bonus=  fpusv['bonus'] || 0;
                                // }
                                // else
                                // {
                                //     finalResultArr.bonus=0;
                                //     finalResultArr.amount=0;
                                //     finalResultArr.prize_money=fpusv['amount'];
                                // }
                                let checkWinningUser = await finalResultModel.findOne({
                                    joinedid: mongoose.Types.ObjectId(fpuskjoinid),
                                    userid: mongoose.Types.ObjectId(fpusk)
                                });
                                // console.log("---checkWinningUser---",checkWinningUser)
                                if (!checkWinningUser) {
                                    await finalResultModel.create(finalResultArr);
                                    const user = await userModel.findOne({ _id: fpusk }, { userbalance: 1, totalwinning: 1 });
                                    // console.log("---user---",user)
                                    // let type
                                    // if (challenge.amount_type == 'prize') {
                                    //     type = 'Challenge Winning Prize ';
                                    // } else {
                                    //     type = 'Challenge Winning Amount';
                                    // }
                                    if (user) {
                                        if (fpusv['amount'] > 10000) {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;

                                            let tds_amount = (31.2 / 100) * fpusv['amount'];
                                            let amount = fpusv['amount'] - tds_amount;
                                            let tdsData = {
                                                userid: fpusk,
                                                amount: fpusv['amount'],
                                                tds_amount: tds_amount,
                                                challengeid: challenge._id,
                                                seriesid: listmatches[0].series
                                            };
                                            const userObj = {
                                                'userbalance.balance': balance,
                                                'userbalance.bonus': bonus,
                                                'userbalance.winning': winning + amount,
                                                'totalwinning': totalwinning + amount
                                            };
                                            const transactiondata = {
                                                type: 'Challenge Winning Amount',
                                                amount: amount,
                                                total_available_amt: totalBalance + amount,
                                                transaction_by: constant.APP_SHORT_NAME,
                                                challengeid: challenge._id,
                                                userid: fpusk,
                                                paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                bal_bonus_amt: bonus,
                                                bal_win_amt: winning + amount,
                                                bal_fund_amt: balance,
                                                win_amt: amount,
                                                transaction_id: transactionidsave
                                            };
                                            // console.log("---userObj--1-",userObj)
                                            // console.log("----userObj--1--",userObj)
                                            // console.log("---transactiondata--1-",transactiondata)
                                            await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                tdsDetailModel.create(tdsData),
                                                TransactionModel.create(transactiondata),
                                            ]);
                                            if (fpusv['amount'] > 0) {
                                                let entryfee = challenge.entryfee;
                                                let userid = fpusk;
                                                await LevelServices.give_referrer_bonus(userid, entryfee);
                                            }
                                        } else {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;
                                            let amount = fpusv['amount'];
                                            let userObj;
                                            let total_available_amt;
                                            let bal_win_amt;
                                            let type;
                                            let transactiondata;
                                            // console.log("--------fpusv['gift_type']----///----",fpusv)
                                            if (fpusv['gift_type'] == "gift") {
                                                type = "Challenge Winning Gift"
                                                total_available_amt = totalBalance
                                                bal_win_amt = totalwinning
                                                userObj = {
                                                    'userbalance.balance': balance,
                                                    'userbalance.bonus': bonus,
                                                    'userbalance.winning': winning,
                                                    'totalwinning': totalwinning

                                                };
                                                transactiondata = {
                                                    type: type,
                                                    amount: 0,
                                                    prize: amount,
                                                    total_available_amt: total_available_amt,
                                                    transaction_by: constant.APP_SHORT_NAME,
                                                    challengeid: challenge._id,
                                                    userid: fpusk,
                                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                    bal_bonus_amt: bonus,
                                                    bal_win_amt: bal_win_amt,
                                                    bal_fund_amt: balance,
                                                    win_amt: 0,
                                                    transaction_id: transactionidsave
                                                };

                                            } else {
                                                type = "Challenge Winning Amount"
                                                total_available_amt = totalBalance + amount;
                                                bal_win_amt = winning + amount;
                                                userObj = {
                                                    'userbalance.balance': balance,
                                                    'userbalance.bonus': bonus,
                                                    'userbalance.winning': bal_win_amt,
                                                    'totalwinning': total_available_amt

                                                };
                                                transactiondata = {
                                                    type: type,
                                                    amount: amount,
                                                    total_available_amt: total_available_amt,
                                                    transaction_by: constant.APP_SHORT_NAME,
                                                    challengeid: challenge._id,
                                                    userid: fpusk,
                                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                    bal_bonus_amt: bonus,
                                                    bal_win_amt: bal_win_amt,
                                                    bal_fund_amt: balance,
                                                    win_amt: amount,
                                                    transaction_id: transactionidsave
                                                };
                                            }


                                            // console.log("----transactiondata---",transactiondata)
                                            // console.log("--userObj---",userObj)
                                            let myinserttt = await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                TransactionModel.create(transactiondata)
                                            ]);
                                            // console.log("---myinserttt--",myinserttt)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        }
        return true;
    }


    async checkIfArray(globalarray, userpoints) {
        console.log("-------------------------------------checkIfArray------------------------------")
        return new Promise((resolve) => {
            var theIndex = -1;
            for (var i = 0; i < globalarray.length; i++) {
                if (globalarray[i].points == userpoints) {
                    theIndex = i;
                    resolve(theIndex);
                }
            }
            if (i >= globalarray.length) {
                resolve(theIndex);
            }

        })
    }

    async allRefundAmount(req, reason) {
        console.log("-------------------------------------allRefundAmount-------------------------")
        let { id, status } = req.params;
        let machanllengeData = await matchChallenge.find({ matchkey: mongoose.Types.ObjectId(id) });
        if (machanllengeData.length > 0) {
            for (let challenge of machanllengeData) {
                let getresponse = await this.refundprocess(challenge._id, challenge.entryfee, id, reason);
                if (getresponse == true) {
                    await matchChallenge.updateOne({ _id: mongoose.Types.ObjectId(challenge._id) }, {
                        $set: {
                            status: 'canceled'
                        }
                    });
                }
            }
        }
    }

    // async insertProfitLossData(){
    //     try{
    //         var date = new Date();
    //         date.setDate(date.getDate() - 1);
    //        let lastDate=moment(Date.now(date)).format('YYYY-MM-DD');
    //         console.log("lastDate...............",lastDate);
    //         console.log("start_date:{$gte:lastDate},final_status:constant.MATCH_FINAL_STATUS.WINNER_DECLARED....",lastDate,constant.MATCH_FINAL_STATUS.WINNER_DECLARED);
    //         const getListMatch = await listMatches.find({start_date:{$gte:lastDate},final_status:constant.MATCH_FINAL_STATUS.WINNER_DECLARED});
    //         // const getMatch=await listMatches.find({_id:'622f35b75d72aff32916752e'});
    //         console.log("getListMatch..............",getListMatch)
    //         if(getListMatch.length > 0){
    //             for await(let key of getListMatch){

    //                 let data = {};
    //                 data['matchkey'] = key._id;
    //                 data['matchName'] = key.name;
    //                 data['start_date'] = key.start_date;

    //                 let challenges=await matchChallenge.find({matchkey:mongoose.Types.ObjectId(key._id),status:constant.MATCH_CHALLENGE_STATUS.CANCELED},{entryfee:1,is_bonus:1,bonus_percentage:1});
    //                 console.log("challenges...................",challenges)

    //                 let admin_amount_received = 0;
    //                 let bonus = 0;
    //                 if(challenges.length > 0){
    //                     for await(let ckey of challenges){
    //                         let sumOfBonus = 0;
    //                         let sumOfbalance = 0;
    //                         let sumofwinning = 0;

    //                         let real_money = await joinLeague.find({challengeid:mongoose.Types.ObjectId(ckey._id)},{leaugestransaction:1});
    //                         console.log("real_money........??????????....",real_money)

    //                         if(real_money.length > 0){
    //                             for await(let countMoney of real_money){
    //                                 sumOfBonus += countMoney.leaugestransaction?.bonus
    //                                 sumOfbalance += countMoney.leaugestransaction?.balance
    //                                 sumofwinning += countMoney.leaugestransaction?.winning
    //                             }
    //                         }
    //                         let actual_received = sumOfbalance + sumofwinning ;

    //                         admin_amount_received += actual_received
    //                         bonus += sumOfBonus
    //                     }
    //                 }
    //                 console.log("bonus..........///////////////.",bonus)
    //                 data.invested_amount=admin_amount_received.toFixed(2);

    //                 let winning_amt=await finalResultModel.find({matchkey:mongoose.Types.ObjectId(key._id)});
    //                 let sumOfamount_wininngAmt=0;
    //                 for await(let wAmtCount of winning_amt){
    //                     sumOfamount_wininngAmt += wAmtCount.amount
    //                 }
    //                 let tds_amount = await tdsDetailModel.find({matchkey:mongoose.Types.ObjectId(key._id)});
    //                 let sumofTDS_amt=0;
    //                 for await(let tdsKey of tds_amount){
    //                     sumofTDS_amt += tdsKey.amount
    //                 }
    //                 console.log("sumofTDS_amt......................................",sumofTDS_amt)
    //                 data.win_amount = sumOfamount_wininngAmt.toFixed(2);
    //                 data.TDS_amount= sumofTDS_amt.toFixed(2);

    //                 // let refund_amt=await refundMatch.aggregate[
    //                 //     {$match:{matchkey:mongoose.Types.ObjectId(key._id)}},
    //                 //     {$group:{
    //                 //         _id: mongoose.Types.ObjectId(key._id),
    //                 //         sumofamount: {
    //                 //           $sum: '$amount'
    //                 //         }
    //                 //       }}
    //                 // ];
    //                 // data.refund_amount=(refund_amt[0].sumofamounts).toFixed(2)  || 0 ;

    //                 let refund_amt = await refundMatch.find({matchkey:mongoose.Types.ObjectId(key._id)});
    //                 let sumof_refundAmt=0;
    //                 for await(let refundKey of refund_amt){
    //                     sumof_refundAmt += refundKey.amount ;
    //                 }
    //                 console.log("sumof_refundAmt............................................",sumof_refundAmt)
    //                 data.refund_amount=(sumof_refundAmt).toFixed(2) ;
    //                 let youtuber_bonus=0;
    //                 data.youtuber_bonus = youtuber_bonus;

    //                 // let cashback_amt =0; // no cashback collection
    //                 let distributed=sumOfamount_wininngAmt + youtuber_bonus ;
    //                 let p_and_l = admin_amount_received - distributed ;
    //                 let amount_profit_or_loss
    //                 if( admin_amount_received > distributed ){ amount_profit_or_loss=admin_amount_received - distributed}else{ amount_profit_or_loss= distributed - admin_amount_received}
    // console.log("p_and_l......................................",p_and_l);
    // console.log("distributed.................................",distributed);
    //                 if(p_and_l < 0){
    //                     data.profit_or_loss = 'Loss' ;
    //                 }else if(p_and_l == 0){
    //                     data.profit_or_loss = 'None' ;
    //                 }else{
    //                     data.profit_or_loss = 'Profit' ;
    //                 }

    //                 data.profit_or_loss_amount = amount_profit_or_loss.toFixed(2);

    //                 const checkMatchKey=await profitLossModel.findOne({matchkey:mongoose.Types.ObjectId(key._id)});
    //                 if(checkMatchKey){
    //                     const updateData=await profitLossModel.updateOne({matchkey:mongoose.Types.ObjectId(key._id)},{
    //                         $set:data
    //                     });
    //                     if(updateData.modifiedCount > 0){
    //                         const updateReportStatus=await listMatches.updateOne({_id:mongoose.Types.ObjectId(key._id)},{
    //                             $set:{
    //                                 report_status:1
    //                             }
    //                         })
    //                         // return{
    //                         //     status:true,
    //                         //     message:'profit/loss data successfully update'
    //                         // }
    //                     }
    //                     // else{
    //                     //     return{
    //                     //         status:false,
    //                     //         message:'profit/loss not insert ..error'
    //                     //     }
    //                     // }

    //                 }else{

    //                     let insertData=new profitLossModel(data);
    //                     let saveData=await insertData.save();
    //                     if(saveData){
    //                         const updateReportStatus=await listMatches.updateOne({_id:mongoose.Types.ObjectId(key._id)},{
    //                             $set:{
    //                                 report_status:1
    //                             }
    //                         })
    //                         // return{
    //                         //     status:true,
    //                         //     data:saveData,
    //                         //     message:'profit/loss data successfully insert'
    //                         // }
    //                     }
    //                     // else{
    //                     //     return{
    //                     //         status:false,
    //                     //         message:'profit/loss not insert ..error'
    //                     //     }
    //                     // }
    //                 }

    //         }
    //         }else{
    //             return {
    //                         status:false,
    //                         message:'listmatch not found'
    //                     }
    //         }
    //         return {
    //             status:true,
    //             message:'update Successfully'
    //         }


    //     }catch(error){
    //         next(error);
    //     }
    // }
    async userTeamModified({ body }) {
        try {
            let { teamId, ...rest } = body;
            const data = await joinTeam.findByIdAndUpdate({ _id: teamId }, rest, { new: true });
            if (data) {
                return {
                    statusCode: 200,
                    status: true,
                    message: "update succesfully !",
                    data: [data]
                };
            } else {
                return {
                    statusCode: 400,
                    status: false,
                    message: "Not update !",
                    data: []
                };
            };
        } catch (error) {
            console.log(error);
        };
    };
    async insertProfitLossData() {
        try {
            console.log("----insertProfitLoassData----")
            var date = new Date();
            date.setDate(date.getDate() - 1);
            let lastDate = moment(date).format('YYYY-MM-DD');
            // --------------------------------List Match Data-----------------
            const listMatchData = await listMatches.find({ final_status: constant.MATCH_FINAL_STATUS.WINNER_DECLARED });
            // const listMatchData = await listMatches.find({_id:mongoose.Types.ObjectId("6401560e942db1fe17eebc06")});
            if (listMatchData.length > 0) {
                for (let match of listMatchData) {
                    let checkPL = await profitLossModel.findOne({ matchkey: match._id });
                    if (!checkPL) {
                        let data = {};
                        data.matchkey = match._id;
                        data.matchName = match.name;
                        data.start_date = match.start_date;
                        let agePipe = [];
                        agePipe.push({
                            $match: {
                                matchkey: mongoose.Types.ObjectId(match._id),
                                joinedusers: { $ne: 0 },
                                status: { $ne: "canceled" }
                            }
                        });
                        agePipe.push({
                            $project: {
                                _id: 1
                            }
                        })

                        agePipe.push({
                            $lookup: {
                                from: "joinedleauges",
                                localField: "_id",
                                foreignField: "challengeid",
                                as: "joinedleaugesData"
                            }
                        })

                        agePipe.push({
                            $unwind: {
                                path: "$joinedleaugesData"
                            }
                        })

                        agePipe.push({
                            $addFields: {
                                ttlBalanace: { $sum: ["$joinedleaugesData.leaugestransaction.balance", "$joinedleaugesData.leaugestransaction.winning"] },
                                ttlBonus: "$joinedleaugesData.leaugestransaction.bonus"
                            }
                        })

                        agePipe.push({
                            $group: {
                                _id: "",
                                admin_amt_received: { $sum: "$ttlBalanace" },
                                bonus: { $first: "$ttlBonus" }
                            }
                        })
                        const challengeData = await matchChallenge.aggregate(agePipe);
                        // console.log('challengeData--->',challengeData);
                        let admin_amt_received = 0;
                        let bonus = 0;
                        let refund_Amount = 0;
                        let neArrya = [];
                        if (challengeData.length > 0) {
                            admin_amt_received = challengeData[0].admin_amt_received
                            bonus = challengeData[0].bonus
                        }
                        data.invested_amount = admin_amt_received.toFixed(2);
                        const winningAmount = await finalResultModel.aggregate([
                            {
                                $match: {
                                    matchkey: mongoose.Types.ObjectId(match._id),
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: "$amount" }
                                }
                            }
                        ]);
                        const tdsAmount = await tdsDetailModel.aggregate([
                            {
                                $match: {
                                    matchkey: mongoose.Types.ObjectId(match._id),
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: "$tds_amount" }
                                }
                            }
                        ]);
                        let tds_amount = (tdsAmount.length > 0) ? tdsAmount[0].amount : 0;
                        let winning_amt = (winningAmount.length > 0) ? winningAmount[0].amount : 0;
                        console.log('tds_amount', tds_amount);
                        let winn = Number(winning_amt) - Number(tds_amount);
                        data.win_amount = winn.toFixed(2);
                        data.TDS_amount = tds_amount.toFixed(2);

                        const refundAmt = await refundMatchModel.aggregate([
                            {
                                $match: {
                                    matchkey: mongoose.Types.ObjectId(match._id),
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: "$amount" }
                                }
                            }
                        ]);
                        let refund_amt = (refundAmt.length > 0) ? refundAmt[0].amount : 0;
                        data.refund_amount = Number(refund_amt) - Number(bonus);
                        const youtuberBonus = await youtuberBonusModel.aggregate([
                            {
                                $match: {
                                    matchkey: mongoose.Types.ObjectId(match._id),
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    amount: { $sum: "$amount" }
                                }
                            }
                        ]);
                        let youtuber_bonus = (youtuberBonus.length > 0) ? youtuberBonus[0].amount : 0;
                        data.youtuber_bonus = youtuber_bonus.toFixed(2);
                        let distributed = Number(winning_amt) + Number(youtuber_bonus);
                        let p_and_l = admin_amt_received - distributed;
                        let amount_profit_or_loss = admin_amt_received > distributed ? admin_amt_received - distributed : distributed - admin_amt_received;
                        if (p_and_l < 0) {
                            data['profit_or_loss'] = 'Loss';
                        }
                        else if (p_and_l == 0) {
                            data['profit_or_loss'] = 'None';
                        } else {
                            data['profit_or_loss'] = 'Profit';
                        }
                        data.profit_or_loss_amount = amount_profit_or_loss.toFixed(2);
                        // console.log('data--->',data);
                        let insertData = await profitLossModel.create(data);
                    }
                }
            }
            console.log('sdfsdf');
            return { status: true }
        } catch (error) {
            console.log(error)
            return { status: false }
        }
    }
    async functionleaderboard(seriesId) {
        // try{
        let mypip = [];
        mypip.push({
            $match: {
                series: mongoose.Types.ObjectId(seriesId),
                launch_status: "launched",
                final_status: { $ne: 'IsAbandoned' },
                final_status: { $ne: 'IsCanceled' },
                status: { $ne: "notstarted" },
            },
        });
        mypip.push({
            $lookup: {
                from: "jointeams",
                localField: "_id",
                foreignField: "matchkey",
                as: "joinTeamData"
            },
        });
        mypip.push({
            $unwind: {
                path: "$joinTeamData",
            },
        });
        mypip.push({
            $lookup: {
                from: "joinedleauges",
                localField: "joinTeamData._id",
                foreignField: "teamid",
                as: "joinedleaugesData"
            },
        });
        mypip.push({
            $unwind: {
                path: "$joinedleaugesData",
            },
        });
        mypip.push({
            $lookup: {
                from: "users",
                localField: "joinTeamData.userid",
                foreignField: "_id",
                as: "userData"
            },
        });
        mypip.push({
            $unwind: {
                path: "$userData",
            },
        });
        mypip.push({
            $group: {
                _id: {
                    'userid': "$joinedleaugesData.userid",
                    'matchkey': "$_id",
                },
                allTeams: {
                    $push: "$$ROOT"
                }
            },
        });
        mypip.push({
            $addFields: {
                maxScore: {
                    $max: {
                        $map: {
                            input: "$allTeams.joinTeamData.points",
                            in: { $max: "$$this" }
                        }
                    }
                }
            },
        });
        mypip.push({
            $unwind: {
                path: "$allTeams",
            },
        });
        mypip.push({
            $addFields: {
                userid: "$_id.userid",
                matchkey: "$_id.matchkey",
                points: "$maxScore",
                jointeam_id: "$allTeams.joinTeamData._id",
                teamnumber: "$allTeams.joinTeamData.teamnumber"
            },
        });
        mypip.push({
            $project: {
                userid: 1,
                matchkey: 1,
                points: 1,
                jointeam_id: 1,
                teamnumber: 1,
                maxScore: 1
            },
        });

        const getData = await listMatchesModel.aggregate(mypip);
        if (getData.length > 0) {

            for await (let key of getData) {
                let newLeaderBorad;
                if (key.points == key.maxScore) {
                    let _isSeries = await series_leaderboardModel.findOne({ series_id: mongoose.Types.ObjectId(seriesId) });
                    if (!_isSeries) {
                        let addLeaderBoard = new series_leaderboardModel({
                            points: key.maxScore,
                            matchkey: key.matchkey,
                            userid: key.userid,
                            series_id: seriesId,
                            jointeam_id: key.jointeam_id,
                            teamnumber: key.teamnumber
                        });
                        newLeaderBorad = await addLeaderBoard.save();
                    } else {
                        newLeaderBorad = await series_leaderboardModel.findOneAndUpdate({ series_id: mongoose.Types.ObjectId(seriesId) }, {
                            points: key.maxScore,
                            matchkey: key.matchkey,
                            userid: key.userid,
                            series_id: seriesId,
                            jointeam_id: key.jointeam_id,
                            teamnumber: key.teamnumber
                        });
                    }
                    // console.log("---newLeaderBorad---", newLeaderBorad)
                }

            }
        }
        return 1;

    }

    async series_leaderboard(req, res) {
        try {
            const curDate = moment().format("YYYY-MM-DD HH:mm:ss");
            let mypipline = [];
            mypipline.push({
                $match: {
                    status: 'opened',
                    end_date: { $gte: curDate },
                    has_leaderboard: 'yes'
                },
            })
            mypipline.push({
                $lookup: {
                    from: 'listmatches',
                    let: { seriesId: "$_id", launch_status: "launched" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$series", "$$seriesId"] }, { $eq: ["$launch_status", "$$launch_status"] }],
                                },
                            },
                        }
                    ],
                    as: "listmatcheData"
                }
            })
            const seriesfind = await seriesModel.aggregate(mypipline);
            let newArray = [];
            if (seriesfind.length > 0) {
                for await (let series of seriesfind) {
                    let mydata = await this.functionleaderboard(series._id);
                    newArray.push(mydata)
                }
            }
            return 1;
        } catch (error) {
            console.log(error)
        }
    }

    async cancelMatch(req) {
        try {
            const matchContest = await matchChallengersModel.find({ matchkey: req.query.matchkey });

            if (matchContest.length > 0) {
                for await (let key of matchContest) {
                    req.params.MatchChallengerId = key._id

                    const getMatchContestData = await matchChallengersModel.findOne({ _id: req.params.MatchChallengerId, matchkey: req.query.matchkey });

                    if (getMatchContestData) {
                        let joinLeagues = await JoinLeaugeModel.find({ matchkey: getMatchContestData.matchkey, challengeid: getMatchContestData._id });

                        if (joinLeagues.length > 0) {
                            for (let league of joinLeagues) {
                                let leaugestransaction = league.leaugestransaction;
                                let randomStr = randomstring.generate({
                                    length: 4,
                                    charset: 'alphabetic',
                                    capitalization: 'uppercase'
                                });
                                let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });

                                if (!refund_data) {
                                    const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                                    if (user) {
                                        const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                        const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                        const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                        const totalBalance = bonus + balance + winning;
                                        const userObj = {
                                            'userbalance.balance': balance + leaugestransaction.balance,
                                            'userbalance.bonus': bonus + leaugestransaction.bonus,
                                            'userbalance.winning': winning + leaugestransaction.winning,
                                        };

                                        let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                                        let refundData = {
                                            userid: leaugestransaction.user_id,
                                            amount: getMatchContestData.entryfee,
                                            joinid: league._id,
                                            challengeid: league.challengeid,
                                            matchkey: getMatchContestData.matchkey,
                                            reason: 'cancel custom contest',
                                            transaction_id: transaction_id
                                        };

                                        const transactiondata = {
                                            type: 'Refund',
                                            amount: getMatchContestData.entryfee,
                                            total_available_amt: totalBalance + getMatchContestData.entryfee,
                                            transaction_by: constant.APP_SHORT_NAME,
                                            challengeid: getMatchContestData._id,
                                            userid: leaugestransaction.user_id,
                                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                            bal_bonus_amt: bonus + leaugestransaction.bonus,
                                            bal_win_amt: winning + leaugestransaction.winning,
                                            bal_fund_amt: balance + leaugestransaction.balance,
                                            bonus_amt: leaugestransaction.bonus,
                                            win_amt: leaugestransaction.winning,
                                            addfund_amt: leaugestransaction.balance,
                                            transaction_id: transaction_id
                                        };

                                        let profmiss = await Promise.all([
                                            userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                                            refundMatchModel.create(refundData),
                                            TransactionModel.create(transactiondata)
                                        ]);

                                    }
                                }
                            }
                        }
                        const getMatchContestData1 = await matchChallengersModel.updateOne({ _id: req.params.MatchChallengerId }, {
                            $set: {
                                status: constant.MATCH_CHALLENGE_STATUS.CANCELED
                            }
                        });


                    }
                }
            }
            //sahil redis
            let keyname = `listMatchesModel-${req.query.matchkey}`
            let redisdata = await Redis.getkeydata(keyname);
            //   let real_matchkey;
            if (redisdata) {
                redisdata["final_status"] = req.query.status;
                let redisdataa = Redis.setkeydata(keyname, redisdata, 60 * 60 * 4);
            }


            //sahil redis end
            const updateMatchCancel = await listMatchesModel.updateOne({ _id: req.query.matchkey }, {
                $set: {
                    final_status: req.query.status
                }
            })



            return {
                status: true,
                message: 'match cancel successfully'
            }

        } catch (error) {
            console.log(error)
        }
    }
    async updateMatchscore(req) {
        try {
            console.log("hello")
            if (req.body.matchkey && req.body.playerid && req.body.field && req.body.value) {
                let { matchkey, playerid, field, value } = req.body;
                //sahil
                let obj = { [field]: value };
                // console.log("objabcde"+JSON.stringify(obj))
                const updatescoreData = await resultMatchModel.updateOne({ matchkey: req.body.matchkey, player_id: req.body.playerid }, obj)
                // jgfhgdhgfhgfhgfhgf
                console.log(updatescoreData)
                // console.log("updatescoreDataabcd"+JSON.stringify(updatescoreData)+"req.body.matchkey"+req.body.matchkey+"req.body.playerid"+req.body.playerid)
                //sahil redis
                let keyname = `listMatchesModel-${req.body.matchkey}`
                let redisdata = await Redis.getkeydata(keyname);
                let real_matchkey;
                if (redisdata) {
                    real_matchkey = redisdata;
                }
                else {
                    real_matchkey = await listMatchesModel.findOne({ _id: req.body.matchkey })
                    let redisdata = Redis.setkeydata(keyname, real_matchkey, 60 * 60 * 4);
                }

                //sahil redis end    
                // comment for redis--->const real_matchkey = await listMatchesModel.find({_id:req.body.matchkey})
                console.log("real_matchkeyabcd" + JSON.stringify(real_matchkey))
                //console.log("real_matchkey"+real_matchkey)
                //console.log("real_matchkey.real_matchkeyasdf "+real_matchkey[0].real_matchkey+"real_matchkey"+real_matchkey)
                // this.getScoresUpdates(real_matchkey[0].real_matchkey, matchkey);
                this.playerPoint(req.body.matchkey, real_matchkey.format);
                //console.log("---updatescoreData",updatescoreData)
            }
            return true;
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = new resultServices();