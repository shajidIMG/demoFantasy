const moment = require("moment");
const mongoose = require('mongoose');
const matchServices = require('../services/matchServices');
const listMatchModel = require('../../models/listMatchesModel');
const teamModel = require('../../models/teamModel');
const userModel = require('../../models/userModel');
const transactionModel = require('../../models/transactionModel');
const matchPlayersModel = require('../../models/matchPlayersModel');


class matchController {
    constructor() {
        return {
            view_AllUpcomingMatches: this.view_AllUpcomingMatches.bind(this),
            view_AllUpcomingMatches_table: this.view_AllUpcomingMatches_table.bind(this),
            addMatchPage: this.addMatchPage.bind(this),
            addMatchData: this.addMatchData.bind(this),
            edit_Match: this.edit_Match.bind(this),
            edit_match_data: this.edit_match_data.bind(this),
            view_AllMatches: this.view_AllMatches.bind(this),
            view_AllMatches_table: this.view_AllMatches_table.bind(this),
            launch_Match: this.launch_Match.bind(this),
            launch: this.launch.bind(this),
            launchMatchChangeTeamLogo: this.launchMatchChangeTeamLogo.bind(this),
            updatePlaying11: this.updatePlaying11.bind(this),
            updatePlaying11Team1Data: this.updatePlaying11Team1Data.bind(this),
            updatePlaying11Team2Data: this.updatePlaying11Team2Data.bind(this),
            updateTeam1Playing11: this.updateTeam1Playing11.bind(this),
            updateTeam2Playing11: this.updateTeam2Playing11.bind(this),
            updatePlaying11Launch: this.updatePlaying11Launch.bind(this),
            launchMatchPlayerUpdateData: this.launchMatchPlayerUpdateData.bind(this),
            matchPlayerDelete: this.matchPlayerDelete.bind(this),
            unlaunchMatch: this.unlaunchMatch.bind(this),
            //sahil overfantasy
            overfantasy: this.overfantasy.bind(this),

        }
    }

    async view_AllUpcomingMatches(req, res, next) {
        try {
            res.locals.message = req.flash();
            res.render("matches/viewallUpComingMatch", {
                sessiondata: req.session.data,
            });
        } catch (error) {
            // next(error);
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/");
        }
    }

    async view_AllUpcomingMatches_table(req, res, next) {
        try {
            // let limit1 = req.query.length;
            // let start = req.query.start;
            // let  sortObject = { start_date: 1 },
            //     dir, join
            //  console.log("sortObject..",sortObject);
            // let name;
            // if (req.query.name && req.query.name !== "")
            // {
            //     name = req.query.name;
            //     console.log("name..",name)
            // }
            // let conditions = {};
            // conditions.start_date = { $gte: moment().format('YYYY-MM-DD HH:mm:ss') }
            let aggPipe = [];
            aggPipe.push({
                $match: {
                    is_deleted: false,
                    "final_status": { $ne: "isCanceled" }
                }
            });
            let today = new Date()
            today.setHours(today.getHours() + 5);
            today.setMinutes(today.getMinutes() + 30);
            console.log("today", today)
            aggPipe.push({
                $addFields: {
                    startdate: { $toString: "$start_date" }
                }
            });

            aggPipe.push({
                $addFields: {
                    date: {

                        $dateFromString: {
                            dateString: '$startdate',
                            //    timezone: "-00:00"
                        }
                    },
                    curDate: today
                }
            });
            aggPipe.push({
                $match: {
                    $expr: {
                        $and: [{
                            $gte: ['$date', today],
                        },
                        ],
                    },
                }
            });

            aggPipe.push({
                $sort: {
                    'date': 1,
                },
            });

            aggPipe.push({
                $lookup: {
                    from: "teams",
                    localField: "team1Id",
                    foreignField: "_id",
                    as: "team1",
                }
            });

            aggPipe.push({
                $lookup: {
                    from: "teams",
                    localField: "team2Id",
                    foreignField: "_id",
                    as: "team2",
                }
            });

            aggPipe.push({
                $unwind: {
                    path: "$team1",
                }
            });

            aggPipe.push({
                $unwind: {
                    path: "$team2",
                }
            });

            listMatchModel.countDocuments(aggPipe).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                let ssss = 1;
                let CricketType;
                console.log("params" + req.query.val)

                listMatchModel.aggregate(aggPipe).exec(async (err, rows1) => {

                    // console.log('--------rows1-------------', rows1);
                    if (err) console.log(err);
                    for (const index of rows1) {
                        // console.log(index.fantasy_type == req.query.val)
                        if (index.fantasy_type == req.query.val) {
                            CricketType = index.fantasy_type

                            //console.log("---listMatchModels---->>>", index.date, ssss++)
                            let team1 = await teamModel.findOne({ _id: index.team1Id });
                            let team2 = await teamModel.findOne({ _id: index.team2Id });
                            //console.log("team1",team1._doc,"team2",team2.logo)
                            // let team1logo = `<img src=${team1.logo ? `${team1.logo}` : 'team_image.png'} class="w-40px view_team_table_images2 h-40px rounded-pill">`;
                            // let team2logo = `<img src=${team2.logo ? `${team2.logo}` : 'team_image.png'} class="w-40px view_team_table_images2 h-40px rounded-pill">`;
                            let team1logo = `<img src="${process.env.BASE_URL}/${team1.logo ? "logo.png" : "logo.png"}" class="w-40px view_team_table_images2 h-40px rounded-pill">`;
                            let team2logo = `<img src="${process.env.BASE_URL}/${team2.logo ? "logo.png"  : "logo.png" }" class="w-40px view_team_table_images2 h-40px rounded-pill">`;
                            // https://api.DemoFantasy.com/api process.env.BASE_URL
                            let action = '';
                            let start_date_format = moment(index.start_date, 'YYYY-MM-DD hh:mm:ss').format('dddd, DD-MMM-YYYY, h:mm:ss a');
                            let start_date = `<div class="text-center"><span class="font-weight-bold text-success">${start_date_format.split(',')[0]},</span><br>
                        <span class="font-weight-bold text-primary">${start_date_format.split(',')[1]}</span><br>
                        <span class="font-weight-bold text-danger">${start_date_format.split(',')[2]}</span></div>`
                            if (index.squadstatus == 'YES') {
                                action += `<a href="/edit-match/${index._id}"  class="btn-sm btn my-1 btn-info w-35px h-35px mr-1" data-toggle="tooltip" title data-original-title="Edit Match & series"><i class="fas fa-pencil"></i></a>`;
                                if (index.series) {
                                    if (index.launch_status == 'launched') {
                                        action += `<a href="/launch-match/${index._id}" class="btn-sm btn my-1 btn-orange w-35px h-35px" data-toggle="tooltip" title="View Match"><i class="far fa-eye"></i></a></a>`;
                                    } else {
                                        action += `<a href="/launch-match/${index._id}" class="btn-sm btn my-1 btn-primary w-35px h-35px" data-toggle="tooltip" title="Launch Match"><i class="fas fa-rocket"></i></a>`;
                                    }
                                }
                            } else {
                                action += `<a href="#" class=" btn-sm btn my-1 btn-success w-35px h-35px" data-toggle="tooltip" title data-original-title="Import Players"><i class="fad fa-download"></i></a>`
                            }
                            data.push({
                                "count": count,
                                "Match Type": CricketType,
                                "match": `<div class="d-flex align-items-center">
                            <div class="col">
                                <div class="row">
                                    <div class="col-12 fs-13 text-center">${index.team1.teamName}</div>
                                    <div class="col-12 text-center">
                                        ${team1logo}
                                    </div>
                                </div>
                            </div>
                            <div class="col-auto">
                                <div class="row">
                                    <div class="col-12 text-center font-weight-bold">V/S</div>
                                </div>
                            </div>
                            <div class="col">
                                <div class="row">
                                    <div class="col-12 fs-13 text-center">${index.team2.teamName}</div>
                                    <div class="col-12 text-center">
                                    ${team2logo}
                                    </div>
                                </div>
                            </div>
                        </div>`,
                                "start_date": start_date,
                                "match_order": index.match_order,
                                "squadstatus": index.squadstatus ? `<div class="text-center"><i class="fad fa-users text-success"></i> <span class="text-success">${index.squadstatus}</span></div>` : '<div class="text-center"><i class="fad fa-users text-danger"></i> <span class="text-danger">NO</span></div>',
                                "Actions": action,
                            });
                            count++;
                            // console.log("hii" + count + "length" + rows1.length)
                            // if (count > rows1.length) {
                            //     // console.log(`data------SERVICES---------`, data);


                            // }
                        }

                    }
                    let json_data = JSON.stringify({
                        "recordsTotal": rows,
                        "recordsFiltered": totalFiltered,
                        "data": data
                    });

                    res.send(json_data);
                });
            });
        } catch (error) {

        }
    }

    async addMatchPage(req, res, next) {
        try {
            res.locals.message = req.flash();
            const data = await matchServices.addMatchPage(req);
            if (data) {
                res.render("matches/addMatch", {
                    sessiondata: req.session.data,
                    msg: undefined,
                    allSeries: data.seriesData,
                    allTeam: data.teamData
                });
            }

        } catch (error) {

            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }
    async addMatchData(req, res, next) {
        try {
            res.locals.message = req.flash();
            const data = await matchServices.addMatchData(req);
            if (data.status) {
                req.flash('success', data.message);
                res.redirect("/view_AllUpcomingMatches");
            } else {
                req.flash('error', data.message);
                res.redirect("/add-match_page");
            }

        } catch (error) {

            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }


    async edit_Match(req, res, next) {
        try {
            res.locals.message = req.flash();
            const data = await matchServices.edit_Match(req);
            // console.log('data---editMatch controller', data);
            if (data) {
                res.render("matches/editMatch", {
                    sessiondata: req.session.data,
                    msg: undefined,
                    data
                });
            }
        } catch (error) {
            console.log("error",error)
            // next(error);
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }

    async edit_match_data(req, res, next) {
        try {
            res.locals.message = req.flash();
            // console.log("---req.edit match--",req.body,"--params--",req.params,"---query--",req.query)
            const data = await matchServices.edit_match_data(req);
            // console.log('data---controller', data);
            if (data.status = true) {
                req.flash('success', data.message);
                return res.redirect("/view_AllUpcomingMatches");
            } else {
                req.flash('error', data.message);
                return res.redirect(`/edit-match/${req.params.id}`);
            }

        } catch (error) {
            // next(error);
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }



    // sahil overfantsy work
    async overfantasy(req, res, next) {
        try {
            const updatelistmatch = await matchServices.overfantasy(req);
            if (updatelistmatch.status) {
                req.flash('success', updatelistmatch.message);
                res.redirect(`/launch-match/${updatelistmatch.newMatchId}`);
            } else if (updatelistmatch.status == false) {
                req.flash('error', updatelistmatch.message);
                res.redirect(`/launch-match/${req.params.id}`);
            }
        } catch (error) {
            console.log("--", error);
            req.flash('error', "Something wrong please try again letter");
            res.redirect(`/launch-match/${req.body.matchId}`);
        }
    }
    //



    // async edit_match_data(req, res, next) {
    //     try {
    //         res.locals.message = req.flash();
    //         // console.log("---req.edit match--",req.body,"--params--",req.params,"---query--",req.query)
    //         const data = await matchServices.edit_match_data(req);
    //         // console.log('data---controller', data);
    //         if (data.status = true) {
    //             req.flash('success', data.message);
    //             return res.redirect("/view_AllUpcomingMatches");
    //         } else {
    //             req.flash('error', data.message);
    //             return res.redirect(`/edit-match/${req.params.id}`);
    //         }

    //     } catch (error) {
    //         // next(error);
    //         req.flash('error', 'something is wrong please try again later');
    //         res.redirect("/view_AllUpcomingMatches");
    //     }
    // }

    async view_AllMatches(req, res, next) {
        try {
            res.locals.message = req.flash();
            let fantasy_type = req.query.fantasy_type;
            // ,{seriesName:req.query.seriesName,start_date:req.query.start_date,end_date:req.query.end_date}
            let doc = {};
            if (req.query.name) {
                doc.name = req.query.name
            }
            if (req.query.status) {
                doc.status = req.query.status
            }
            if (req.query.sStatus) {
                doc.sStatus = req.query.sStatus
            }
            res.render("matches/viewallMatches", {
                sessiondata: req.session.data,
                doc,
                fantasy_type
            });
        } catch (error) {
            // next(error);
            console.log("error", error)
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/");
        }
    }

    async view_AllMatches_table(req, res, next) {
        try {
            console.log("status", req.query.status)

            // console.log('req------DATATABLE-------controller');
            let limit1 = req.query.length;
            let start = req.query.start;
            let fantasy_type = req.query.fantasy_type;
            let sortObject = {},
                dir, join
            let conditions = { fantasy_type: fantasy_type };

            if (req.query.name) {
                conditions.name = {
                    $regex: new RegExp("^" + req.query.name.toLowerCase(), "i")
                }
            }
            if (req.query.status) {
                if (!req.query.sStatus) {
                    conditions.launch_status = req.query.status
                }
            }
            if (req.query.sStatus && req.query.status) {
                conditions = {
                    status: req.query.sStatus,
                    launch_status: req.query.status
                }
            }
            if (req.query.sStatus) {
                conditions.status = req.query.sStatus
            }

            // console.log("conditions.....", conditions);

            listMatchModel.countDocuments(conditions).exec((err, rows) => {
                // console.log("rows....................",rows)
                let totalFiltered = rows;
                let data = [];
                let count = 1;

                listMatchModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                    // console.log('--------rows1-------------', rows1);
                    if (err) console.log(err);
                    for (const index of rows1) {

                        let action, launch_status, final_status, status;
                        let start_date_format = moment(index.start_date, 'YYYY-MM-DD hh:mm:ss').format('dddd, DD-MMM-YYYY, h:mm:ss a');
                        let start_date = `<div class="text-center"><span class="font-weight-bold text-success">${start_date_format.split(',')[0]},</span><br>
                    <span class="font-weight-bold text-primary">${start_date_format.split(',')[1]}</span><br>
                    <span class="font-weight-bold text-danger">${start_date_format.split(',')[2]}</span></div>`
                        if (index.launch_status == 'pending') {
                            launch_status = `<span class="text-warning font-weight-bold">pending</span>`
                        } else {
                            launch_status = `<span class="text-success font-weight-bold">launched</span>`

                        }
                        if (index.final_status == 'pending') {
                            final_status = `<span class="text-warning font-weight-bold">pending</span>`
                        } else if (index.final_status == 'winnerdeclared') {
                            final_status = `<span class="text-success font-weight-bold">winnerdeclared</span>`

                        } else if (index.final_status == 'IsReviewed') {
                            final_status = `<span class="text-warning font-weight-bold">IsReviewed</span>`

                        } else if (index.final_status == 'IsAbandoned') {
                            final_status = `<span class="text-danger font-weight-bold">IsAbandoned</span>`

                        } else {
                            final_status = `<span class="text-danger font-weight-bold">IsCanceled</span>`

                        }

                        if (index.status == 'notstarted') {
                            status = `<span class="text-warning font-weight-bold">Not Started</span>`
                        } else if (index.status == 'pending') {
                            status = `<span class="text-warning font-weight-bold">pending</span>`

                        } else if (index.status == 'started') {
                            status = `<span class="text-success font-weight-bold">started</span>`

                        } else {
                            status = `<span class="text-success font-weight-bold">completed</span>`
                        }

                        action = `<a href="/edit-match/${index._id}" class="btn btn-sm btn-primary w-35px h-35px" data-toggle="tooltip" title="Edit Match & add series"><i class="fad fa-pencil"></i></a>`

                        data.push({
                            "count": count,
                            "start_date": start_date,
                            "match": `<div class="text-center">${index.name}</div>`,
                            "launch_status": launch_status,
                            "final_status": final_status,
                            "status": status,
                            "Actions": action
                        });
                        count++;

                        if (count > rows1.length) {
                            // console.log(`data------SERVICES---------`, data);
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            res.send(json_data);

                        }
                    }
                });
            });
        } catch (error) {

        }
    }

    async launch_Match(req, res, next) {
        try {
            res.locals.message = req.flash();
            const data = await matchServices.launch_Match(req);
            //console.log("req.params.id"+req.params.id)
            const listMatches = await listMatchModel.find({ _id: req.params.id });
            console.log("listMatches" + listMatches)
            if (data.status === false) {
                // console.log("data..lunch match..",data[0])
                req.flash('error', data.message);
                res.render("matches/launchMatch", { sessiondata: req.session.data, msg: data.message, data, launcMatchData: listMatches });
            } else {
                // console.log("data..lunch match datra...bbb.........",data)
                res.render("matches/launchMatch", { sessiondata: req.session.data, msg: undefined, data, launcMatchData: listMatches });
            }
        } catch (error) {
            // next(error);
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }

    async launch(req, res, next) {
        try {
            const data = await matchServices.launch(req);
            if (data.succes === true) {
                req.flash('success', 'Match Launched ..!!');
                res.redirect(`/create-custom-contest?matchkey=${req.params.id}&fantasy_type=${req.query.fantasy_type}`);
            } else {
                req.flash('error', data.message);
                res.redirect(`/launch-match/${req.params.id}`);
            }

        } catch (error) {
            // next(error);
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }

    async launchMatchChangeTeamLogo(req, res, next) {
        try {
            // console.log("req..........",req.query,",,,,",req.params,"req.body.",req.body)
            const updateLogoTeam = await matchServices.launchMatchChangeTeamLogo(req);
            if (updateLogoTeam.status == true) {
                req.flash('success', updateLogoTeam.message);
                res.redirect(`/launch-match/${req.query.matchId}`);

            } else if (updateLogoTeam.status == false) {
                req.flash('error', updateLogoTeam.message);
                res.redirect(`/launch-match/${req.query.matchId}`);
            }

        } catch (error) {
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/view_AllUpcomingMatches");
        }
    }
    async launchMatchPlayerUpdateData(req, res, next) {
        try {
            // matchId
            const updatePlayer = await matchServices.launchMatchPlayerUpdateData(req);
            console.log('updatePlayer', updatePlayer);
            if (updatePlayer.status == true) {
                req.flash('success', updatePlayer.message);
                res.redirect(`/launch-match/${req.body.matchId}`);
            } else if (updatePlayer.status == false) {
                req.flash('error', updatePlayer.message);
                res.redirect(`/launch-match/${req.body.matchId}`);
            }
        } catch (error) {
            req.flash('error', updatePlayer.message);
            res.redirect(`/launch-match/${req.body.matchId}`);
        }
    }
    async matchPlayerDelete(req, res, next) {
        try {
            const deletePlayer = await matchServices.matchPlayerDelete(req);
            if (deletePlayer.status == true) {
                req.flash('success', deletePlayer.message);
                res.redirect(`/launch-match/${req.query.matchId}`);
            } else if (deletePlayer.status == false) {
                req.flash('error', deletePlayer.message);
                res.redirect(`/launch-match/${req.query.matchId}`);
            }
        } catch (error) {
            req.flash('error', 'Something went wrong please try again');
            res.redirect("/");
        }
    }
    async unlaunchMatch(req, res, next) {
        try {
            const changeStatus = await matchServices.unlaunchMatch(req);
            if (changeStatus.status == true) {
                req.flash('success', changeStatus.message)
                res.redirect(`/launch-match/${req.params.id}`)
            } else if (changeStatus.status == false) {
                req.flash('error', changeStatus.message)
                res.redirect(`/launch-match/${req.params.id}`)
            }

        } catch (error) {
            next(error);
        }
    }

    async updatePlaying11(req, res, next) {
        try {
            res.locals.message = req.flash();
            console.log("req.query", req.query)
            let fantasy_type = req.query?.fantasy_type;
            console.log("hii1")
            // 1st condition
            let condition1 = [];
            condition1.push({
                $match: {
                    $and: [{
                        launch_status: 'launched'
                    },
                    {
                        final_status: 'pending'
                    }
                    ]
                }
            });

            condition1.push({
                $lookup: {
                    from: 'teams',
                    localField: 'team1Id',
                    foreignField: '_id',
                    as: 'team1data'
                }
            });

            condition1.push({
                $lookup: {
                    from: 'teams',
                    localField: 'team2Id',
                    foreignField: '_id',
                    as: 'team2data'
                }
            });

            condition1.push({
                $unwind: {
                    path: '$team1data'
                }
            });

            condition1.push({
                $unwind: {
                    path: '$team2data'
                }
            });

            // 2nd condition
            let condition2 = [];
            condition1.push({
                $match: {
                    $and: [{
                        launch_status: 'launched'
                    },
                    {
                        final_status: 'pending'
                    }
                    ]
                }
            });

            condition2.push({
                $lookup: {
                    from: 'teams',
                    localField: 'team1Id',
                    foreignField: '_id',
                    as: 'team1data'
                }
            });

            condition2.push({
                $lookup: {
                    from: 'teams',
                    localField: 'team2Id',
                    foreignField: '_id',
                    as: 'team2data'
                }
            });

            condition2.push({
                $unwind: {
                    path: '$team1data'
                }
            });

            condition2.push({
                $unwind: {
                    path: '$team2data'
                }
            });

            condition2.push({
                $match: {
                    _id: mongoose.Types.ObjectId(req.query?.matchid)
                }
            })

            const matches = await listMatchModel.aggregate(condition1);
            const matches1 = await listMatchModel.aggregate(condition2);
            console.log("-----matchid----", req.query?.matchid)
            console.log("hii12")
            res.render('matches/updatePlaying11', {
                sessiondata: req.session?.data,
                matchid: req.query?.matchid,
                matches,
                matches1,
                fantasy_type
            });
        } catch (error) {
            console.log("error", error)
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/");
        }
    }

    async updatePlaying11Team1Data(req, res, next) {
        try {
            let limit = req.query.length;
            let start = req.query.start;
            let fantasy_type = req.query?.fantasy_type;
            //console.log("fantasy_type",fantasy_type)
            console.log("qurery", req.query)
            let sortObj = {},
                dir, join;

            let condition = [];

            condition.push({
                $match: {
                    matchkey: mongoose.Types.ObjectId(req.query.matchid)
                }
            });

            condition.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'match'
                }
            });

            condition.push({
                $unwind: {
                    path: '$match'
                }
            });
            condition.push({
                $match: {
                    "match.fantasy_type": "Cricket"
                }
            });

            condition.push({
                $lookup: {
                    from: 'players',
                    'let': {
                        playerid: '$playerid',
                        team1: '$match.team1Id',
                        team2: '$match.team2Id'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                    $eq: [
                                        '$_id',
                                        '$$playerid'
                                    ]
                                }]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            team: {
                                $cond: {
                                    'if': {
                                        $eq: [
                                            '$team',
                                            '$$team1'
                                        ]
                                    },
                                    then: 'team1',
                                    'else': {
                                        $cond: {
                                            'if': {
                                                $eq: [
                                                    '$team',
                                                    '$$team2'
                                                ]
                                            },
                                            then: 'team2',
                                            'else': ''
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ],
                    as: 'team'
                }
            })


            condition.push({
                $addFields: {
                    team: {
                        $arrayElemAt: [
                            '$team.team',
                            0
                        ]
                    },
                    match: ''
                }
            });

            condition.push({
                $group: {
                    _id: '$team',
                    team: {
                        $push: '$$ROOT'
                    }
                }
            })

            matchPlayersModel.countDocuments(condition).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                let team1 = [];
                matchPlayersModel.aggregate(condition).exec((err, rows1) => {
                    console.log("rows1", rows1)
                    rows1.forEach(i => {
                        if (i._id == 'team1') {
                            team1.push(i);
                        }
                    })

                    team1[0]?.team.forEach(async doc => {
                        data.push({
                            count: count,
                            playerName: `<p onclick="selectNameToCheckedTeam1('${doc.playerid.toString()}')" style='cursor:pointer'>${doc.name}</p>`,
                            playerRole: `<span class="font-weight-bold text-orange">${doc.role}</span>`,
                            playerCredit: doc.credit,
                            action: `<div class="form-check mb-3">
                                <input type="hidden" id="team1_all" value="${doc.playerid}" name="team1_all[]">
                                <input class="form-check-input" type="checkbox" value="${doc.playerid}" id="team1_playing" name="team1_playing[]" onclick="return team1MaxChecked()" ${doc.vplaying == 1 ? 'checked' : ''}>
                                <label class="form-check-label" for="team1_playing"></label>
                            </div>`
                        })
                        count++
                    })
                    if (count > rows1.length) {
                        let json_data = JSON.stringify({ data })
                        res.send(json_data);
                    }
                })
            })

        } catch (error) {
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/update-playing11");
        }
    }

    async updatePlaying11Team2Data(req, res, next) {
        try {
            let limit = req.query.length;
            let start = req.query.start;
            let fantasy_type = req.query?.fantasy_type
            //console.log("fantasy_type",fantasy_type)
            console.log("query", req.query)
            let sortObj = {},
                dir, join;

            let condition = [];

            condition.push({
                $match: {
                    matchkey: mongoose.Types.ObjectId(req.query.matchid)
                }
            });

            condition.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'match'
                }
            });

            condition.push({
                $unwind: {
                    path: '$match'
                }
            });
            condition.push({
                $match: {
                    "match.fantasy_type": "Cricket"
                }
            });

            condition.push({
                $lookup: {
                    from: 'players',
                    'let': {
                        playerid: '$playerid',
                        team1: '$match.team1Id',
                        team2: '$match.team2Id'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                    $eq: [
                                        '$_id',
                                        '$$playerid'
                                    ]
                                }]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            team: {
                                $cond: {
                                    'if': {
                                        $eq: [
                                            '$team',
                                            '$$team1'
                                        ]
                                    },
                                    then: 'team1',
                                    'else': {
                                        $cond: {
                                            'if': {
                                                $eq: [
                                                    '$team',
                                                    '$$team2'
                                                ]
                                            },
                                            then: 'team2',
                                            'else': ''
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ],
                    as: 'team'
                }
            })

            condition.push({
                $addFields: {
                    team: {
                        $arrayElemAt: [
                            '$team.team',
                            0
                        ]
                    },
                    match: ''
                }
            });

            condition.push({
                $group: {
                    _id: '$team',
                    team: {
                        $push: '$$ROOT'
                    }
                }
            })

            matchPlayersModel.countDocuments(condition).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                let team2 = [];
                matchPlayersModel.aggregate(condition).exec((err, rows1) => {
                    rows1.forEach(i => {
                        if (i._id == 'team2') {
                            team2.push(i);
                        }
                    })
                    team2[0]?.team.forEach(async doc => {
                        data.push({
                            count: count,
                            playerName: `<p onclick="selectNameToCheckedTeam2('${doc.playerid.toString()}')" style='cursor:pointer'>${doc.name}</p>`,
                            playerRole: `<span class="font-weight-bold text-orange">${doc.role}</span>`,
                            playerCredit: doc.credit,
                            action: `<div class="form-check mb-3">
                                <input type="hidden" id="team2_all" value="${doc.playerid}" name="team2_all[]">
                                <input class="form-check-input "  type="checkbox" value="${doc.playerid}"  id="team2_playing" name="team2_playing[]" onclick="return team2MaxChecked()" ${doc.vplaying == 1 ? 'checked' : ''}>
                                <label class="form-check-label" for="team2_playing"></label>
                            </div>`
                        })
                        count++
                    })
                    if (count > rows1.length) {
                        let json_data = JSON.stringify({ data })
                        res.send(json_data);
                    }
                })
            })

        } catch (error) {
            req.flash('error', 'something is wrong please try again later');
            res.redirect("/update-playing11");
        }
    }

    async updateTeam1Playing11(req, res, next) {
        try {
            let condition = [];

            condition.push({
                $match: {
                    _id: mongoose.Types.ObjectId(req.query.matchid)
                }
            })

            const match = await listMatchModel.aggregate(condition)

            let t1 = await matchServices.updateTeam1Playing11(req);
            if (t1.status == false) {
                req.flash("error", t1.message)
                res.redirect("/update-playing11");
            } else if (t1.status == true) {
                req.flash("success", t1.message)
                res.redirect(`/update-playing11?matchid=${match[0]._id}`);
            }
        } catch (error) {
            throw (error)
        }
    }

    async updateTeam2Playing11(req, res, next) {
        try {
            let condition = [];

            condition.push({
                $match: {
                    _id: mongoose.Types.ObjectId(req.query.matchid)
                }
            })

            const match = await listMatchModel.aggregate(condition)

            let t2 = await matchServices.updateTeam2Playing11(req);
            if (t2.status == false) {
                req.flash("error", t2.message)
                res.redirect("/update-playing11");
            } else if (t2.status == true) {
                req.flash("success", t2.message)
                res.redirect(`/update-playing11?matchid=${match[0]._id}`);
            }
        } catch (error) {
            throw (error)
        }
    }

    async updatePlaying11Launch(req, res, next) {
        try {
            let launch = await matchServices.updatePlaying11Launch(req);
            if (launch.status == true) {
                req.flash("success", launch.message)
                res.redirect("/update-playing11");
            } else {
                req.flash("error", launch.message);
                res.redirect("/update-playing11");
            }
        } catch (error) {
            throw error;
        }
    }

}
module.exports = new matchController();