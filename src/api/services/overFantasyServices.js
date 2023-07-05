const mongoose = require("mongoose");
const randomstring = require("randomstring");
const moment = require("moment");
const axios = require("axios");
const fs = require("fs");

require("../../models/challengersModel");
require("../../models/playerModel");
require("../../models/teamModel");
const matchchallengesModel = require("../../models/matchChallengersModel");
const overMatchModel = require("../../models/overmatches");
const overpointsModel = require("../../models/overpoints");
const listMatchesModel = require("../../models/listMatchesModel");
const SeriesModel = require("../../models/addSeriesModel");
const matchPlayersModel = require("../../models/matchPlayersModel");
const JoinLeaugeModel = require("../../models/JoinLeaugeModel");
const playerModel = require("../../models/playerModel");
const JoinTeamModel = require("../../models/JoinTeamModel");
const matchrunModel = require("../../models/matchRunModel");
const EntityApiController = require("../../admin/controller/cricketApiController");
const userModel = require("../../models/userModel");
const constant = require("../../config/const_credential");
const NOTIFICATION_TEXT = require("../../config/notification_text");
const { deleteOne } = require("../../models/matchChallengersModel");
const Redis = require("../../utils/redis");
const matchOverModel = require("../../models/matchOverModel");
const overContestModel = require("../../models/overContestModel");
const overJoinTeam = require("../../models/overJoinTeam");
// ------over fantasy---
//const JoinTeamModel = require("../../models/overJoinedTeam");

class overfantasyServices {
  constructor() {
    return {
      overfantasy_getmatchlist: this.overfantasy_getmatchlist.bind(this),
      latestJoinedMatches: this.latestJoinedMatches.bind(this),
      OverfantasyAllCompletedMatches:
        this.OverfantasyAllCompletedMatches.bind(this),
      overfantasy_createTeam: this.overfantasy_createTeam.bind(this),
      overGetMyTeams: this.overGetMyTeams.bind(this),
      overInformations: this.overInformations.bind(this),
      overfantasy_Newjoinedmatches:
        this.overfantasy_Newjoinedmatches.bind(this),
      overviewTeam: this.overviewTeam.bind(this),
      updateIsViewedForBoatTeam: this.updateIsViewedForBoatTeam.bind(this),
      overlivematches: this.overlivematches.bind(this),
      pointcount: this.pointcount.bind(this),
      getMatchOverList: this.getMatchOverList.bind(this),
      getAllContest: this.getAllContest.bind(this),
      getAllContesttrail: this.getAllContesttrail.bind(this),
      getallplayersOverFantasy: this.getallplayersOverFantasy.bind(this),
      
      
      
    };
  }

  async latestJoinedMatches(req) {
    const aggPipe = [];
    console.log("------req.user._id----", req.user._id);
    aggPipe.push({
      $match: {
        userid: mongoose.Types.ObjectId(req.user._id),
      },
    });
    aggPipe.push({
      $group: {
        _id: "$matchkey",
        matchkey: { $first: "$matchkey" },
        joinedleaugeId: { $first: "$_id" },
        userid: { $first: "$userid" },
        matchchallengeid: { $first: "$challengeid" },
        jointeamid: { $first: "$teamid" },
      },
    });
    aggPipe.push({
      $lookup: {
        from: "listmatches",
        localField: "matchkey",
        foreignField: "_id",
        as: "match",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$match",
      },
    });

    aggPipe.push({
      $match: {
        "match.fantasy_type": "overfantasy",
      },
    });
    aggPipe.push({
      $match: {
        $or: [
          {
            $and: [
              { "match.final_status": "pending" },
              { "match.status": "started" },
            ],
          },
          {
            $and: [
              { "match.status": "completed" },
              { "match.final_status": "IsReviewed" },
            ],
          },
          {
            $and: [
              { "match.status": "notstarted" },
              { "match.final_status": "pending" },
            ],
          },
        ],
      },
    });
    // aggPipe.push({
    //     $sort: {
    //         'match.start_date': -1,
    //     },
    // });
    aggPipe.push({
      $limit: 5,
    });
    aggPipe.push({
      $lookup: {
        from: "joinedleauges",
        let: { matchkey: "$matchkey", userid: "$userid" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$matchkey", "$$matchkey"],
                  },
                  {
                    $eq: ["$userid", "$$userid"],
                  },
                ],
              },
            },
          },
        ],
        as: "joinedleauges",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$joinedleauges",
      },
    });
    aggPipe.push({
      $group: {
        _id: "$joinedleauges.challengeid",
        // matchchallengeid: { $first: '$joinedleauges.challengeid' },
        joinedleaugeId: { $first: "$joinedleauges._id" },
        matchkey: { $first: "$matchkey" },
        jointeamid: { $first: "$jointeamid" },
        userid: { $first: "$userid" },
        match: { $first: "$match" },
      },
    });
    // aggPipe.push({
    //     $lookup: {
    //         from: 'matchchallenges',
    //         localField: '_id',
    //         foreignField: '_id',
    //         as: 'matchchallenge',
    //     },
    // });
    // aggPipe.push({
    //     $unwind: {
    //         path: '$matchchallenge',
    //         preserveNullAndEmptyArrays: true,
    //     },
    // });
    aggPipe.push({
      $group: {
        _id: "$matchkey",
        joinedleaugeId: { $first: "$joinedleaugeId" },
        matchkey: { $first: "$matchkey" },
        jointeamid: { $first: "$jointeamid" },
        match: { $first: "$match" },
        count: { $sum: 1 },
      },
    });
    // aggPipe.push({
    //     $match:{
    //         'match.final_status':'IsReviewed'
    //     }
    // },);
    aggPipe.push({
      $lookup: {
        from: "series",
        localField: "match.series",
        foreignField: "_id",
        as: "series",
      },
    });
    aggPipe.push({
      $lookup: {
        from: "teams",
        localField: "match.team1Id",
        foreignField: "_id",
        as: "team1",
      },
    });
    aggPipe.push({
      $lookup: {
        from: "teams",
        localField: "match.team2Id",
        foreignField: "_id",
        as: "team2",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$series",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$team1",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$team2",
      },
    });
    aggPipe.push({
      $project: {
        _id: 0,
        matchkey: 1,
        playing11_status: { $ifNull: ["$match.playing11_status", 1] },
        matchname: { $ifNull: ["$match.name", ""] },
        team1ShortName: { $ifNull: ["$team1.short_name", ""] },
        team2ShortName: { $ifNull: ["$team2.short_name", ""] },
        teamfullname1: { $ifNull: ["$team1.teamName", 0] },
        teamfullname2: { $ifNull: ["$team2.teamName", 0] },
        team1color: {
          $ifNull: ["$team1.color", constant.TEAM_DEFAULT_COLOR.DEF1],
        },
        team2color: {
          $ifNull: ["$team2.color", constant.TEAM_DEFAULT_COLOR.DEF1],
        },
        team1logo: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "/"] },
                    { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "t"] },
                  ],
                },
                then: { $concat: [`${constant.BASE_URL}`, "", "$team1.logo"] },
                else: "$team1.logo",
              },
            },
            `${constant.BASE_URL}team_image.png`,
          ],
        },
        team2logo: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "/"] },
                    { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "t"] },
                  ],
                },
                then: { $concat: [`${constant.BASE_URL}`, "", "$team2.logo"] },
                else: "$team2.logo",
              },
            },
            `${constant.BASE_URL}team_image.png`,
          ],
        },
        start_date: { $ifNull: ["$match.start_date", "0000-00-00 00:00:00"] },
        status: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $lt: [
                    "$match.start_date",
                    moment().format("YYYY-MM-DD HH:mm:ss"),
                  ],
                },
                then: "closed",
                else: "opened",
              },
            },
            "opened",
          ],
        },
        launch_status: { $ifNull: ["$match.launch_status", ""] },
        final_status: { $ifNull: ["$match.final_status", ""] },
        series_name: { $ifNull: ["$series.name", ""] },
        type: { $ifNull: ["$match.fantasy_type", "Cricket"] },
        series_id: { $ifNull: ["$series._id", ""] },
        winning_status: "pending",
        available_status: { $ifNull: [1, 1] },
        joinedcontest: { $ifNull: ["$count", 0] },
        team1Id: "$match.team1Id",
        team2Id: "$match.team2Id",
      },
    });
    const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
    // console.log('JoiendMatches -->', JoiendMatches)
    return JoiendMatches;
  }

  async overfantasy_getmatchlist() {
    try {
      let matchpipe = [];
      let date = moment().format("YYYY-MM-DD HH:mm:ss");
      console.log(`date`, date);
      let EndDate = moment().add(25, "days").format("YYYY-MM-DD HH:mm:ss");
      matchpipe.push({
        $match: { fantasy_type: "overfantasy" },
      });
      matchpipe.push({
        $match: {
          $and: [
            { status: "notstarted" },
            { launch_status: "launched" },
            { start_date: { $gt: date } },
            { start_date: { $lt: EndDate } },
          ],
          final_status: { $nin: ["IsCanceled", "IsAbandoned"] },
        },
      });

      matchpipe.push({
        $lookup: {
          from: "teams",
          localField: "team1Id",
          foreignField: "_id",
          as: "team1",
        },
      });
      matchpipe.push({
        $lookup: {
          from: "teams",
          localField: "team2Id",
          foreignField: "_id",
          as: "team2",
        },
      });
      matchpipe.push({
        $lookup: {
          from: "series",
          localField: "series",
          foreignField: "_id",
          as: "series",
        },
      });
      matchpipe.push({
        $match: { "series.status": "opened" },
      });
      matchpipe.push({
        $sort: {
          start_date: 1,
        },
      });
      matchpipe.push({
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          format: 1,
          order_status: 1,
          series: { $arrayElemAt: ["$series._id", 0] },
          seriesname: { $arrayElemAt: ["$series.name", 0] },
          team1name: { $arrayElemAt: ["$team1.short_name", 0] },
          team2name: { $arrayElemAt: ["$team2.short_name", 0] },
          teamfullname1: { $arrayElemAt: ["$team1.teamName", 0] },
          teamfullname2: { $arrayElemAt: ["$team2.teamName", 0] },
          matchkey: 1,
          type: "$fantasy_type",
          winnerstatus: "$final_status",
          playing11_status: 1,
          team1color: {
            $ifNull: [
              { $arrayElemAt: ["$team1.color", 0] },
              constant.TEAM_DEFAULT_COLOR.DEF1,
            ],
          },
          team2color: {
            $ifNull: [
              { $arrayElemAt: ["$team2.color", 0] },
              constant.TEAM_DEFAULT_COLOR.DEF1,
            ],
          },
          team1logo: {
            $ifNull: [
              {
                $cond: {
                  if: {
                    $or: [
                      {
                        $eq: [
                          {
                            $substr: [
                              { $arrayElemAt: ["$team1.logo", 0] },
                              0,
                              1,
                            ],
                          },
                          "/",
                        ],
                      },
                      {
                        $eq: [
                          {
                            $substr: [
                              { $arrayElemAt: ["$team1.logo", 0] },
                              0,
                              1,
                            ],
                          },
                          "t",
                        ],
                      },
                    ],
                  },
                  then: {
                    $concat: [
                      `${constant.BASE_URL}`,
                      "",
                      { $arrayElemAt: ["$team1.logo", 0] },
                    ],
                  },
                  else: { $arrayElemAt: ["$team1.logo", 0] },
                },
              },
              `${constant.BASE_URL}team_image.png`,
            ],
          },
          team2logo: {
            $ifNull: [
              {
                $cond: {
                  if: {
                    $or: [
                      {
                        $eq: [
                          {
                            $substr: [
                              { $arrayElemAt: ["$team2.logo", 0] },
                              0,
                              1,
                            ],
                          },
                          "/",
                        ],
                      },
                      {
                        $eq: [
                          {
                            $substr: [
                              { $arrayElemAt: ["$team2.logo", 0] },
                              0,
                              1,
                            ],
                          },
                          "t",
                        ],
                      },
                    ],
                  },
                  then: {
                    $concat: [
                      `${constant.BASE_URL}`,
                      "",
                      { $arrayElemAt: ["$team2.logo", 0] },
                    ],
                  },
                  else: { $arrayElemAt: ["$team2.logo", 0] },
                },
              },
              `${constant.BASE_URL}team_image.png`,
            ],
          },
          matchopenstatus: {
            $cond: {
              if: {
                $lte: ["$start_date", moment().format("YYYY-MM-DD HH:mm:ss")],
              },
              then: "closed",
              else: "opened",
            },
          },
          time_start: "$start_date",
          launch_status: 1,
          locktime: EndDate,
          createteamnumber: "1",
          status: "true",
          info_center: 1,
          team1Id: "$team1Id",
          team2Id: "$team2Id",

          match_order: 1,
        },
      });
      matchpipe.push({
        $sort: {
          match_order: 1,
        },
      });

      const result = await listMatchesModel.aggregate(matchpipe);
      console.log("niteshhhh", result);
      result.sort(function (a, b) {
        return b.match_order;
      });
      if (result.length > 0) return result;
      else return [];
    } catch (error) {
      throw error;
    }
  }

  async overfantasy_Newjoinedmatches(req) {
    const aggPipe = [];
    aggPipe.push({
      $match: {
        userid: mongoose.Types.ObjectId(req.user._id),
      },
    });
    console.log("req.user._id", req.user._id);
    aggPipe.push({
      $group: {
        _id: "$matchkey",
        matchkey: { $first: "$matchkey" },
        joinedleaugeId: { $first: "$_id" },
        userid: { $first: "$userid" },
        matchchallengeid: { $first: "$challengeid" },
        jointeamid: { $first: "$teamid" },
      },
    });
    aggPipe.push({
      $lookup: {
        from: "listmatches",
        localField: "matchkey",
        foreignField: "_id",
        as: "match",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$match",
      },
    });

    aggPipe.push({
      $match: {
        "match.fantasy_type": "overfantasy",
      },
    });
    aggPipe.push({
      $match: {
        $or: [
          { "match.final_status": "pending" },
          { "match.final_status": "IsReviewed" },
        ],
      },
    });
    // --------------
    // aggPipe.push({
    //     $sort: {
    //         'match.start_date': -1,
    //     },
    // });
    // ------------
    aggPipe.push({
      $limit: 5,
    });
    aggPipe.push({
      $lookup: {
        from: "joinedleauges",
        let: { matchkey: "$matchkey", userid: "$userid" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$matchkey", "$$matchkey"],
                  },
                  {
                    $eq: ["$userid", "$$userid"],
                  },
                ],
              },
            },
          },
        ],
        as: "joinedleauges",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$joinedleauges",
      },
    });
    aggPipe.push({
      $group: {
        _id: "$joinedleauges.challengeid",
        // matchchallengeid: { $first: '$joinedleauges.challengeid' },
        joinedleaugeId: { $first: "$joinedleauges._id" },
        matchkey: { $first: "$matchkey" },
        jointeamid: { $first: "$jointeamid" },
        userid: { $first: "$userid" },
        match: { $first: "$match" },
      },
    });
    // -----------------
    // aggPipe.push({
    //     $lookup: {
    //         from: 'matchchallenges',
    //         localField: '_id',
    //         foreignField: '_id',
    //         as: 'matchchallenge',
    //     },
    // });
    // aggPipe.push({
    //     $unwind: {
    //         path: '$matchchallenge',
    //         preserveNullAndEmptyArrays: true,
    //     },
    // });
    // --------------
    aggPipe.push({
      $group: {
        _id: "$matchkey",
        joinedleaugeId: { $first: "$joinedleaugeId" },
        matchkey: { $first: "$matchkey" },
        jointeamid: { $first: "$jointeamid" },
        match: { $first: "$match" },
        count: { $sum: 1 },
      },
    });
    aggPipe.push({
      $lookup: {
        from: "series",
        localField: "match.series",
        foreignField: "_id",
        as: "series",
      },
    });
    aggPipe.push({
      $lookup: {
        from: "teams",
        localField: "match.team1Id",
        foreignField: "_id",
        as: "team1",
      },
    });
    aggPipe.push({
      $lookup: {
        from: "teams",
        localField: "match.team2Id",
        foreignField: "_id",
        as: "team2",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$series",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$team1",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$team2",
      },
    });
    aggPipe.push({
      $project: {
        _id: 0,
        matchkey: 1,
        matchname: { $ifNull: ["$match.name", ""] },
        team1ShortName: { $ifNull: ["$team1.short_name", ""] },
        team2ShortName: { $ifNull: ["$team2.short_name", ""] },
        team1fullname: { $ifNull: ["$team1.teamName", ""] },
        team2fullname: { $ifNull: ["$team2.teamName", ""] },
        team1color: {
          $ifNull: ["$team1.color", constant.TEAM_DEFAULT_COLOR.DEF1],
        },
        team2color: {
          $ifNull: ["$team2.color", constant.TEAM_DEFAULT_COLOR.DEF1],
        },
        start_date: "$match.start_date",
        fantasy_type: "$match.fantasy_type",
        team1logo: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "/"] },
                    { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "t"] },
                  ],
                },
                then: { $concat: [`${constant.BASE_URL}`, "", "$team1.logo"] },
                else: "$team1.logo",
              },
            },
            `${constant.BASE_URL}team_image.png`,
          ],
        },
        team2logo: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "/"] },
                    { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "t"] },
                  ],
                },
                then: { $concat: [`${constant.BASE_URL}`, "", "$team2.logo"] },
                else: "$team2.logo",
              },
            },
            `${constant.BASE_URL}team_image.png`,
          ],
        },
        start_date: { $ifNull: ["$match.start_date", "0000-00-00 00:00:00"] },
        status: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $lt: [
                    "$match.start_date",
                    moment().format("YYYY-MM-DD HH:mm:ss"),
                  ],
                },
                then: "closed",
                else: "opened",
              },
            },
            "opened",
          ],
        },
        launch_status: { $ifNull: ["$match.launch_status", ""] },
        final_status: { $ifNull: ["$match.final_status", ""] },
        series_name: { $ifNull: ["$series.name", ""] },
        type: { $ifNull: ["$match.fantasy_type", "Cricket"] },
        series_id: { $ifNull: ["$series._id", ""] },
        available_status: { $ifNull: [1, 1] },
        joinedcontest: { $ifNull: ["$count", 0] },
        playing11_status: { $ifNull: ["$match.playing11_status", 1] },
        team1Id: "$match.team1Id",
        team2Id: "$match.team2Id",
      },
    });
    console.log(
      "------------------moment().format('YYYY-MM-DD HH:mm:ss')----------------------------------",
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    aggPipe.push({
      $match: {
        start_date: { $gt: moment().format("YYYY-MM-DD HH:mm:ss") },
      },
    });
    const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);

    if (JoiendMatches.length > 0) {
      return {
        message: "User Joiend latest 5 Upcoming and live match data..",
        status: true,
        data: JoiendMatches,
      };
    } else {
      return {
        message: "No Data Found..",
        status: false,
        data: [],
      };
    }
  }

  async OverfantasyAllCompletedMatches(req) {
    try {
      console.log("----------req.user._id--------------", req.user._id);
      const aggPipe = [];
      aggPipe.push({
        $match: {
          userid: mongoose.Types.ObjectId(req.user._id),
        },
      });
      aggPipe.push({
        $group: {
          _id: "$matchkey",
          matchkey: { $first: "$matchkey" },
          joinedleaugeId: { $first: "$_id" },
          userid: { $first: "$userid" },
          matchchallengeid: { $first: "$challengeid" },
          jointeamid: { $first: "$teamid" },
        },
      });
      aggPipe.push({
        $lookup: {
          from: "listmatches",
          localField: "matchkey",
          foreignField: "_id",
          as: "match",
        },
      });
      aggPipe.push({
        $unwind: {
          path: "$match",
        },
      });

      aggPipe.push({
        $match: {
          "match.fantasy_type": "overfantasy",
        },
      });
      aggPipe.push({
        $match: { "match.final_status": "winnerdeclared" },
      });
      aggPipe.push({
        $sort: {
          "match.start_date": -1,
        },
      });
      aggPipe.push({
        $lookup: {
          from: "finalresults",
          let: { matchkey: "$matchkey" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$matchkey", "$matchkey"] },
                    { $eq: ["$userid", mongoose.Types.ObjectId(req.user._id)] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                amount: { $sum: "$amount" },
              },
            },
          ],
          as: "finalresultsTotalAmount",
        },
      });
      aggPipe.push({
        $unwind: { path: "$finalresultsTotalAmount" },
      });
      aggPipe.push({
        $lookup: {
          from: "joinedleauges",
          let: { matchkey: "$matchkey", userid: "$userid" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$matchkey", "$$matchkey"],
                    },
                    {
                      $eq: ["$userid", "$$userid"],
                    },
                  ],
                },
              },
            },
          ],
          as: "joinedleauges",
        },
      });
      aggPipe.push({
        $unwind: {
          path: "$joinedleauges",
        },
      });
      aggPipe.push({
        $lookup: {
          from: "matchruns",
          localField: "matchkey",
          foreignField: "matchkey",
          as: "winingData",
        },
      });
      aggPipe.push({
        $unwind: { path: "$winingData" },
      });
      aggPipe.push({
        $group: {
          _id: "$joinedleauges.challengeid",
          joinedleaugeId: { $first: "$joinedleauges._id" },
          matchkey: { $first: "$matchkey" },
          jointeamid: { $first: "$jointeamid" },
          match: { $first: "$match" },
          finalresultsTotalAmount: { $first: "$finalresultsTotalAmount" },
          winingData: { $first: "$winingData" },
        },
      });
      aggPipe.push({
        $lookup: {
          from: "matchchallenges",
          localField: "_id",
          foreignField: "_id",
          as: "matchchallenge",
        },
      });
      aggPipe.push({
        $unwind: {
          path: "$matchchallenge",
          preserveNullAndEmptyArrays: true,
        },
      });
      aggPipe.push({
        $group: {
          _id: "$matchkey",
          joinedleaugeId: { $first: "$joinedleaugeId" },
          matchkey: { $first: "$matchkey" },
          jointeamid: { $first: "$jointeamid" },
          match: { $first: "$match" },
          finalresultsTotalAmount: { $first: "$finalresultsTotalAmount" },
          winingData: { $first: "$winingData" },
          count: { $sum: 1 },
        },
      });
      aggPipe.push({
        $lookup: {
          from: "series",
          localField: "match.series",
          foreignField: "_id",
          as: "series",
        },
      });
      aggPipe.push({
        $lookup: {
          from: "teams",
          localField: "match.team1Id",
          foreignField: "_id",
          as: "team1",
        },
      });
      aggPipe.push({
        $lookup: {
          from: "teams",
          localField: "match.team2Id",
          foreignField: "_id",
          as: "team2",
        },
      });
      aggPipe.push({
        $unwind: {
          path: "$series",
        },
      });
      aggPipe.push({
        $unwind: {
          path: "$team1",
        },
      });
      aggPipe.push({
        $unwind: {
          path: "$team2",
        },
      });
      aggPipe.push({
        $project: {
          _id: 0,
          matchkey: 1,
          matchname: { $ifNull: ["$match.name", ""] },
          winning_status: { $ifNull: ["$winingData.winning_status", ""] },
          team1ShortName: { $ifNull: ["$team1.short_name", ""] },
          team2ShortName: { $ifNull: ["$team2.short_name", ""] },
          team1fullname: { $ifNull: ["$team1.teamName", ""] },
          team2fullname: { $ifNull: ["$team2.teamName", ""] },
          team1color: {
            $ifNull: ["$team1.color", constant.TEAM_DEFAULT_COLOR.DEF1],
          },
          team2color: {
            $ifNull: ["$team2.color", constant.TEAM_DEFAULT_COLOR.DEF1],
          },
          team1logo: {
            $ifNull: [
              {
                $cond: {
                  if: {
                    $or: [
                      { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "/"] },
                      { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "t"] },
                    ],
                  },
                  then: {
                    $concat: [`${constant.BASE_URL}`, "", "$team1.logo"],
                  },
                  else: "$team1.logo",
                },
              },
              `${constant.BASE_URL}team_image.png`,
            ],
          },
          team2logo: {
            $ifNull: [
              {
                $cond: {
                  if: {
                    $or: [
                      { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "/"] },
                      { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "t"] },
                    ],
                  },
                  then: {
                    $concat: [`${constant.BASE_URL}`, "", "$team2.logo"],
                  },
                  else: "$team2.logo",
                },
              },
              `${constant.BASE_URL}team_image.png`,
            ],
          },
          start_date: { $ifNull: ["$match.start_date", "0000-00-00 00:00:00"] },
          fantasy_type: "$match.fantasy_type",
          status: {
            $ifNull: [
              {
                $cond: {
                  if: {
                    $lt: [
                      "$match.start_date",
                      moment().format("YYYY-MM-DD HH:mm:ss"),
                    ],
                  },
                  then: "closed",
                  else: "opened",
                },
              },
              "opened",
            ],
          },
          totalWinningAmount: {
            $ifNull: ["$finalresultsTotalAmount.amount", 0],
          },
          launch_status: { $ifNull: ["$match.launch_status", ""] },
          final_status: { $ifNull: ["$match.final_status", ""] },
          series_name: { $ifNull: ["$series.name", ""] },
          type: { $ifNull: ["$match.fantasy_type", "Cricket"] },
          series_id: { $ifNull: ["$series._id", ""] },
          available_status: { $ifNull: [1, 1] },
          joinedcontest: { $ifNull: ["$count", 0] },
        },
      });
      // aggPipe.push({
      //     $match: {
      //         fantasy_type: req.fantasy_type
      //     }
      // })
      const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
      if (JoiendMatches.length > 0) {
        return {
          message: "User Joiend All Completed Matches Data..",
          status: true,
          data: JoiendMatches,
        };
      } else {
        return {
          message: "No Data Found..",
          status: false,
          data: [],
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async checkForDuplicateTeam(joinlist, onestar,twostar,threestar,playerArray, teamnumber) {
    if (joinlist.length == 0) return true;
    for await (const list of joinlist) {
      if (
        onestar == list.onestar.toString() &&
        twostar == list.twostar.toString() &&
        threestar == list.threestar.toString() &&
        teamnumber != list.teamnumber
    ) {
        const playerscount = await this.findArrayIntersection(playerArray, list.players);
        if (playerscount.length == playerArray.length) return false;
    }
    // return true;
    //   const playerscount = await this.findArrayIntersection(
    //     OverArray,
    //     list.overs
    //   );
    //   if (playerscount.length == OverArray.length) return false;
    }
    return true;
  }

  async findArrayIntersection(currentTeamPlayer,existingTemaPlayer){
    const set1 = new Set(currentTeamPlayer);
    const result = [];
  
    for (let num of existingTemaPlayer) {
      if (set1.has(num.toString())) {
        result.push(num);
      }
  }
  return result
}

  async getMatchTime(start_date) {
    const currentdate = new Date();
    const ISTTime = moment().format('YYYY-MM-DD HH:mm:ss');
    if (ISTTime >= start_date) {
        return false;
    } else {
        return true;
    }
  }

  //pointcount

  async pointcount(matchkey, teamid) {
    //overpointsModel
    //overMatchModel
    let totalpoint = 0;
    let totalpointarray = [];
    const pointcounts = await overMatchModel.find({
      matchkey: matchkey,
      teamid: teamid,
    });
    //  console.log("pointcounts",pointcounts.length)
    //pointcounts=JSON.parse(pointcounts)
    const jointeam = await JoinTeamModel.findOne({ matchkey: matchkey });
    for await (let item of pointcounts) {
      //pointcounts.forEach( async(item)=>{
      totalpoint = 0;
      totalpoint =
        totalpoint +
        item.runs +
        item.fours +
        item.six * 2 +
        item.wicket * -6 +
        item.maiden_over * -2;
      //console.log("asdatotalpoint"+totalpoint)
      if (item.wicket >= 3) totalpoint = totalpoint + 3;
      if (item.runs >= 6 && item.runs <= 10) totalpoint = totalpoint + 1;
      if (item.runs >= 11 && item.runs <= 15) totalpoint = totalpoint + 2;
      if (item.runs >= 16) totalpoint = totalpoint + 4;
      //console.log("totalpoint"+totalpoint)
      totalpointarray.push(totalpoint);
      //console.log("totalpoint"+totalpoint)

      await overMatchModel.updateOne(
        { matchkey: matchkey, teamid: teamid, over: item.over },
        { total_points: totalpoint }
      );

      await overpointsModel.updateOne(
        { matchkey: matchkey, teamid: teamid, over: item.over },
        { total_points: totalpoint }
      );

      //await JoinTeamModel.updateMany({matchkey:matchkey,teamid:teamid,over:item.over},{total_points:totalpoint})

      console.log("item.over" + item.over, "totalpoint", totalpoint);
      for (let ele of jointeam.overs || []) {
        if (
          ele.teamid == teamid &&
          ele.over == item.over &&
          ele.MegaOver == 1
        ) {
          ele.points = 2 * totalpoint;
          console.log("item.over", ele.over, "totalpoint", totalpoint);
        } else if (ele.teamid == teamid && ele.over == item.over) {
          ele.points = totalpoint;
          console.log("item.over", ele.over, "totalpoint", totalpoint);
        }
      }
      //console.log("jointeam.overs"+arr)
    }
    await JoinTeamModel.updateOne(
      { matchkey: matchkey },
      { $set: { overs: jointeam.overs } }
    );
    //console.log("updatejointeam",updatejointeam)
    console.log("asas");
    return true;
  }

  // end pointcount

  ///overinformation

  async overInformations(req) {
    try {
      const response = await axios({
        url: "https://rest.entitysport.com/v2/matches/60071/innings/1/commentary?token=8dac1e4f7ee5ce23c747d7216c1e66c0",
        method: "get",
      });
      console.log(
        "responsefid",
        response.data.response.inning.fielding_team_id
      );
      // const { matchkey, teamid } = req.query;
      // let overData = [];

      // let over =
      // {
      //     "over": 0,
      //     "fours": 0,
      //     "six": 0,
      //     "wickets": 0,
      //     "maiden_over": 0,
      //     "runs": 0,
      // }
      // over.matchkey = matchkey;
      // over.teamid = teamid;

      // let overwicket, oversix, overfour, overmaiden;
      // let overExactinformation = [];
      // let oversinformation = [];
      // let supportive = [];

      // let rawdata = fs.readFileSync('D:\\overfantsy.json');
      // let student = JSON.parse(rawdata);

      // //student.response.commentaries.forEach(item=>{
      // for (let i = 0; i < student.response.commentaries.length; i++) {
      //     if (student.response.commentaries[i].event == "overend") {
      //         student.response.commentaries[i].overwicket = overwicket;

      //         supportive.push(student.response.commentaries[i]);
      //         oversinformation.push(supportive)
      //         supportive = [];
      //         overwicket = 0;

      //     }
      //     else {
      //         if (student.response.commentaries[i].event == "wicket")
      //             overwicket++;
      //         supportive.push(student.response.commentaries[i])
      //     }

      // }
      // //console.log("hii"+oversinformation)
      // oversinformation.forEach(item => {
      //     console.log("hii")
      //     item.forEach(item2 => {
      //         if (item2.six == true) {
      //             console.log("six")
      //             over.six++;
      //         }
      //         if (item2.four == true) {
      //             console.log("four")
      //             over.fours++;
      //         }
      //         if (item2.event == "overend") {
      //             console.log("overend")
      //             over.over = item2.over
      //             over.runs = item2.runs;
      //             over.wickets = item2.overwicket;

      //             if (over.runs == 0)
      //                 over.maiden_over = 1;

      //         }

      //     })

      //     overData.push(over);

      //     //console.log("over"+over)
      //     over =
      //     {
      //         "over": 0,
      //         "fours": 0,
      //         "six": 0,
      //         "wickets": 0,
      //         "maiden_over": 0,
      //         "runs": 0,

      //     }
      //     over.matchkey = matchkey;
      //     over.teamid = teamid;

      // })

      // const saveOverData = await overMatchModel.create(overData)
      // await overpointsModel.create(overData)
      // this.pointcount(matchkey, teamid);

      // return saveOverData

      // const response = await axios({
      // 	url: "https://rest.entitysport.com/v2/matches/60071/innings/1/commentary?token=8dac1e4f7ee5ce23c747d7216c1e66c0",
      // 	method: "get",
      // });
      //console.log(response.data);
    } catch (error) {
      throw error;
    }
  }

  //overinformation

  async overfantasy_createTeam(req) {
    try {
      const { matchkey, teamnumber, onestar,twostar,threestar,players } = req.body;
      console.log("teamnumber" + teamnumber);
      if( !matchkey || !teamnumber || !onestar || !twostar || !threestar || !players)
      return {
        message: `provide data properly [matchkey, teamnumber, onestar,twostar,threestar,players ]`,
        status: false,
        data: {}
    };
      let keyname = `listMatchesModel-${matchkey}`
      let redisdata = await Redis.getkeydata(keyname);
      let listmatchData;
      if (redisdata) {
          listmatchData = redisdata;
      }
      else {
          listmatchData = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
          let redisdata = Redis.setkeydata(keyname, listmatchData, 60 * 60 * 4);
      }   
      if(!listmatchData){
      return {
        message: 'invalid matchkey',
        status: false,
        data: {}
    };
    }
      const playerArray = players.split(',')
      if (playerArray.length > 5) {
          return {
              message: 'Select 5 players only',
              status: false,
              data: {}
          };
      }
      let playerObjectIdArray = [];

      playerArray.forEach((e)=>playerObjectIdArray.push(mongoose.Types.ObjectId(e)))

      const matchPlayersData = await matchPlayersModel.find({
        matchkey: matchkey,
      });
      let credit = 0;
      if (matchPlayersData.length > 0) {
          for (let playerData of matchPlayersData) {
              if (playerArray.includes(playerData._id.toString())) {
                  credit += playerData.credit;
              }
          }
      }
      if (credit > 50) {
          return {
              message: 'Credit exceeded.',
              status: false,
              data: {}
          };
      }
      const joinlist = await overJoinTeam.find({ matchkey: matchkey, userid: req.user._id }).sort({ teamnumber: -1 });
      const duplicateData = await this.checkForDuplicateTeam(joinlist, onestar, twostar,threestar, playerArray, teamnumber);
      if (duplicateData === false) {
        return {
            message: 'You cannot create the same team.',
            status: false,
            data: {}
        };
    }
    
      const matchTime = await this.getMatchTime(listmatchData.start_date);
      if (matchTime === false) {
        return {
          message: "Match has been closed, You cannot create or edit team now",
          status: false,
          data: {},
        };
      }
      const data = {},
        lastplayerArray = [];
 
      data["userid"] = req.user._id;
      data["matchkey"] = matchkey;
      data["teamnumber"] = teamnumber;
      data["type"] = "overfantasy";
      data['players'] = playerObjectIdArray;
      // data['playersArray'] = players;
      data["player_type"] = "classic";
      data['onestar'] = onestar;
      data['twostar'] = twostar;
      data['threestar'] = threestar;
      const joinTeam = await overJoinTeam.findOne({
        matchkey: matchkey,
        teamnumber: parseInt(teamnumber),
        userid: req.user._id,
      }).sort({ teamnumber: -1 });
      if (joinTeam) {
        data["user_type"] = 0;
        data["created_at"] = joinTeam.created_at;
        const updateTeam = await overJoinTeam.findOneAndUpdate(
          { _id: joinTeam._id },
          data,
          {
            new: true,
          }
        );
        console.log("-------------updateTeam-------------", updateTeam);
        if (updateTeam) {
          return {
            message: "Team Updated Successfully",
            status: true,
            data: {
              teamid: updateTeam._id,
            },
          };
        }
      } else {
        const joinTeam = await overJoinTeam.find({
          matchkey: matchkey,
          userid: req.user._id,
        });
        if (joinTeam.length > 0) {
          data["teamnumber"] = joinTeam.length + 1;
        } else {
          data["teamnumber"] = 1;
        }
        if (data["teamnumber"] <= 11) {
          data["user_type"] = 0;
          console.log("datatatatattaatatatatatatataaat", data);
          let jointeamData = await overJoinTeam.create(data);
          if (jointeamData) {
            return {
              message: "Team Created Successfully",
              status: true,
              data: {
                teamid: jointeamData._id,
              },
            };
          }
        } else {
          return {
            message: "You Cannot Create More Team",
            status: false,
            data: {},
          };
        }
      }
    } catch (error) {
      throw error;
    }
  }
  //overviewteam
  async updateIsViewedForBoatTeam(jointeamid) {
    try {
      await JoinTeamModel.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(jointeamid),
          user_type: 1,
          is_viewed: false,
        },
        { is_viewed: true }
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
  //overlivematches
  async overlivematches(req) {
    const aggPipe = [];
    aggPipe.push({
      $match: {
        userid: mongoose.Types.ObjectId(req.user._id),
      },
    });
    aggPipe.push({
      $group: {
        _id: "$matchkey",
        matchkey: { $first: "$matchkey" },
        joinedleaugeId: { $first: "$_id" },
        userid: { $first: "$userid" },
        matchchallengeid: { $first: "$challengeid" },
        jointeamid: { $first: "$teamid" },
      },
    });
    aggPipe.push({
      $lookup: {
        from: "listmatches",
        localField: "matchkey",
        foreignField: "_id",
        as: "match",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$match",
      },
    });
    aggPipe.push({
      $match: {
        "match.fantasy_type": "overfantasy",
      },
    });
    aggPipe.push({
      $match: {
        $or: [
          { "match.final_status": "pending" },
          { "match.final_status": "IsReviewed" },
        ],
      },
    });

    aggPipe.push({
      $lookup: {
        from: "joinedleauges",
        let: { matchkey: "$matchkey", userid: "$userid" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$matchkey", "$$matchkey"],
                  },
                  {
                    $eq: ["$userid", "$$userid"],
                  },
                ],
              },
            },
          },
        ],
        as: "joinedleauges",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$joinedleauges",
      },
    });
    aggPipe.push({
      $group: {
        _id: "$joinedleauges.challengeid",
        // matchchallengeid: { $first: '$joinedleauges.challengeid' },
        joinedleaugeId: { $first: "$joinedleauges._id" },
        matchkey: { $first: "$matchkey" },
        jointeamid: { $first: "$jointeamid" },
        userid: { $first: "$userid" },
        match: { $first: "$match" },
      },
    });
    // aggPipe.push({
    //     $lookup: {
    //         from: 'matchchallenges',
    //         localField: '_id',
    //         foreignField: '_id',
    //         as: 'matchchallenge',
    //     },
    // });
    // aggPipe.push({
    //     $unwind: {
    //         path: '$matchchallenge',
    //         preserveNullAndEmptyArrays: true,
    //     },
    // });
    aggPipe.push({
      $group: {
        _id: "$matchkey",
        joinedleaugeId: { $first: "$joinedleaugeId" },
        matchkey: { $first: "$matchkey" },
        jointeamid: { $first: "$jointeamid" },
        match: { $first: "$match" },
        count: { $sum: 1 },
      },
    });
    aggPipe.push({
      $lookup: {
        from: "series",
        localField: "match.series",
        foreignField: "_id",
        as: "series",
      },
    });
    aggPipe.push({
      $lookup: {
        from: "teams",
        localField: "match.team1Id",
        foreignField: "_id",
        as: "team1",
      },
    });
    aggPipe.push({
      $lookup: {
        from: "teams",
        localField: "match.team2Id",
        foreignField: "_id",
        as: "team2",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$series",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$team1",
      },
    });
    aggPipe.push({
      $unwind: {
        path: "$team2",
      },
    });
    let today = new Date();
    today.setHours(today.getHours() + 5);
    today.setMinutes(today.getMinutes() + 30);
    aggPipe.push({
      $addFields: {
        date: {
          $dateFromString: {
            dateString: "$match.start_date",
            timezone: "-00:00",
          },
        },
        curDate: today,
      },
    });
    aggPipe.push({
      $match: {
        $expr: {
          $and: [
            {
              $lte: ["$date", today],
            },
          ],
        },
      },
    });

    aggPipe.push({
      $sort: {
        date: -1,
      },
    });
    aggPipe.push({
      $project: {
        _id: 0,
        matchkey: 1,
        matchname: { $ifNull: ["$match.name", ""] },
        team1ShortName: { $ifNull: ["$team1.short_name", ""] },
        team2ShortName: { $ifNull: ["$team2.short_name", ""] },
        team1fullname: { $ifNull: ["$team1.teamName", ""] },
        team2fullname: { $ifNull: ["$team2.teamName", ""] },
        team1color: {
          $ifNull: ["$team1.color", constant.TEAM_DEFAULT_COLOR.DEF1],
        },
        team2color: {
          $ifNull: ["$team2.color", constant.TEAM_DEFAULT_COLOR.DEF1],
        },
        start_date: "$match.start_date",
        team1logo: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "/"] },
                    { $eq: [{ $substr: ["$team1.logo", 0, 1] }, "t"] },
                  ],
                },
                then: { $concat: [`${constant.BASE_URL}`, "", "$team1.logo"] },
                else: "$team1.logo",
              },
            },
            `${constant.BASE_URL}team_image.png`,
          ],
        },
        team2logo: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "/"] },
                    { $eq: [{ $substr: ["$team2.logo", 0, 1] }, "t"] },
                  ],
                },
                then: { $concat: [`${constant.BASE_URL}`, "", "$team2.logo"] },
                else: "$team2.logo",
              },
            },
            `${constant.BASE_URL}team_image.png`,
          ],
        },
        start_date: { $ifNull: ["$match.start_date", "0000-00-00 00:00:00"] },
        start_date1: {
          $toDate: { $ifNull: ["$match.start_date", "0000-00-00 00:00:00"] },
        },
        status: {
          $ifNull: [
            {
              $cond: {
                if: {
                  $lt: [
                    "$match.start_date",
                    moment().format("YYYY-MM-DD HH:mm:ss"),
                  ],
                },
                then: "closed",
                else: "opened",
              },
            },
            "opened",
          ],
        },
        launch_status: { $ifNull: ["$match.launch_status", ""] },
        final_status: { $ifNull: ["$match.final_status", ""] },
        series_name: { $ifNull: ["$series.name", ""] },
        type: { $ifNull: ["$match.fantasy_type", "Cricket"] },
        series_id: { $ifNull: ["$series._id", ""] },
        available_status: { $ifNull: [1, 1] },
        joinedcontest: { $ifNull: ["$count", 0] },
        playing11_status: { $ifNull: ["$playing11_status", 1] },
      },
    });
    aggPipe.push({
      $limit: 5,
    });
    const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
    if (JoiendMatches.length > 0) {
      return {
        message: "User Joiend latest 5 Upcoming and live match data..",
        status: true,
        data: JoiendMatches,
      };
    } else {
      return {
        message: "No Data Found..",
        status: false,
        data: [],
      };
    }
  }
  //endoverlivematches
  async overviewTeam(req) {
    try {
      let finalData = [];
      //this.updateIsViewedForBoatTeam(req.query.jointeamid);
      //const listmatchData = await listMatchesModel.findOne({ _id: req.query.matchkey });
      finalData = await JoinTeamModel.findOne({
        _id: req.query.jointeamid,
        matchkey: req.query.matchkey,
        teamnumber: req.query.teamnumber,
      });
      finalData._doc.jointeamid = finalData._id;
      // }).populate({
      //     path: 'players',
      //     populate: {
      //         path: 'playerid',
      //         select: ["player_name", "image", "role", "team"],
      //         as: 'players'
      //     }
      // }).populate({
      //     path: 'captain',
      //     populate: {
      //         path: 'playerid',
      //         select: ["player_name", "image", "role", "team"],
      //         as: 'captain'
      //     }
      // }).populate({
      //     path: 'vicecaptain',
      //     populate: {
      //         path: 'playerid',
      //         select: ["player_name", "image", "role", "team"],
      //         as: "vicecaptain"
      //     }
      // });
      // if (!createTeam) {
      //     return {
      //         message: 'Team Not Available',
      //         status: false,
      //         data: []
      //     }
      // }
      // for await (const playerData of createTeam.players) {
      //     const filterData = await matchPlayersModel.findOne({ _id: playerData._id });
      //     if (!filterData) {
      //         return {
      //             status: false,
      //             message: "match player not found",
      //             data: []
      //         }
      //     }
      //     // ----Inserting Captian image ---------
      //     let Pimage;
      //     if (playerData.playerid && playerData.playerid.image != '' && playerData.playerid.image != null && playerData.playerid.image != undefined) {
      //         if (playerData.playerid.image.startsWith('/p') || playerData.playerid.image.startsWith('p')) {
      //             Pimage = `${constant.BASE_URL}${playerData.playerid.image}`;
      //         } else {
      //             Pimage = playerData.playerid.image;
      //         }
      //     } else {
      //         // Pimage = `${constant.BASE_URL}avtar1.png`
      //         if ((listmatchData.team1Id._id.toString() == playerData.playerid.team.toString())) {
      //             Pimage = `${constant.BASE_URL}white_team1.png`;
      //         } else {
      //             Pimage = `${constant.BASE_URL}black_team1.png`;
      //         }
      //     }
      //     if (!playerData) break;
      //     finalData.push({
      //         id: playerData._id,
      //         name: playerData.playerid.player_name,
      //         role: filterData.role,
      //         credit: filterData.credit,
      //         playingstatus: filterData.playingstatus,
      //         team: listmatchData.team1Id.toString() == playerData.playerid.team.toString() ? 'team1' : 'team2',
      //         image: Pimage,
      //         image1: '',
      //         captain: createTeam.captain._id.toString() == playerData._id.toString() ? 1 : 0,
      //         vicecaptain: createTeam.vicecaptain._id.toString() == playerData._id.toString() ? 1 : 0,
      //         points: filterData.points,
      //         isSelected: false,
      //     });
      // }
      //if (finalData.length == createTeam.players.length) {
      return {
        message: "User Perticular Team Data",
        status: true,
        data: finalData,
      };
      //}
    } catch (error) {
      throw error;
    }
  }
  //overviewendteam

  async overGetMyTeams(req) {
    try {
      console.log(
        "-----------getmyteams-----------",
        req.query,
        "------req.body----",
        req.body
      );
      let finalData = [];
      //sahil redis
      let keyname = `listMatchesModel-${req.query.matchkey}`;
      let redisdata = await Redis.getkeydata(keyname);
      let listmatchData;
      if (redisdata) {
        listmatchData = redisdata;
      } else {
        listmatchData = await listMatchesModel
          .findOne({ _id: req.query.matchkey })
          .populate({
            path: "team1Id",
            select: "short_name",
          })
          .populate({
            path: "team2Id",
            select: "short_name",
          });
        let redisdata = Redis.setkeydata(keyname, listmatchData, 60 * 60 * 4);
      }

      //sahil redis end
      /*for redis comment--->const listmatchData = await listMatchesModel.findOne({ _id: req.query.matchkey }).populate({
                path: 'team1Id',
                select: 'short_name'
            }).populate({
                path: 'team2Id',
                select: 'short_name'
            });*/
      const createTeams = await JoinTeamModel.find({
        matchkey: req.query.matchkey,
        userid: req.user._id,
      });
      if (createTeams.length == 0) {
        return {
          message: "Teams Not Available",
          status: false,
          data: [],
        };
      }
      // //sahil redis
      //  keyname=`overGetMyTeams-${req.query.matchkey}`
      //  redisdata=await Redis.getkeydata(keyname);
      // let matchchallenges;
      // if(redisdata)
      // {
      //     matchchallenges=redisdata;
      // }
      // else
      // {
      //      matchchallenges = await matchchallengesModel.find({ matchkey: mongoose.Types.ObjectId(req.query.matchkey) });
      //     let redisdata=Redis.setkeydata(keyname,matchchallenges,60*60*4);
      // }

      // //sahil redis end
      const matchchallenges = await matchchallengesModel.find({
        matchkey: mongoose.Types.ObjectId(req.query.matchkey),
      });
      console.log(
        `--------------matchchallenges.length----------------`,
        matchchallenges.length
      );

      // ----------total join contest and ----
      const total_teams = await JoinTeamModel.countDocuments({
        matchkey: req.query.matchkey,
        userid: req.user._id,
      });
      const total_joinedcontestData = await JoinLeaugeModel.aggregate([
        {
          $match: {
            userid: mongoose.Types.ObjectId(req.user._id),
            matchkey: mongoose.Types.ObjectId(req.query.matchkey),
          },
        },
        {
          $group: {
            _id: "$challengeid",
          },
        },
        {
          $count: "total_count",
        },
      ]);
      let count_JoinContest = total_joinedcontestData[0]?.total_count;
      // ---------------------//
      let i = 0;
      for (let element of createTeams) {
        i++;
        let Capimage, viceCapimage;
        // ----Inserting Captian image ---------
        Capimage = `${constant.BASE_URL}avtar1.png`;
        viceCapimage = `${constant.BASE_URL}avtar1.png`;
        const tempObj = {
          status: 1,
          userid: req.user._id,
          teamnumber: element.teamnumber,
          isSelected: false,
        };

        if (matchchallenges.length != 0 && req.query.matchchallengeid) {
          for await (const challenges of matchchallenges) {
            console.log(`----chalenges---viewmyteam api--`);
            if (
              challenges._id.toString() == req.query.matchchallengeid.toString()
            ) {
              const joindata = await JoinLeaugeModel.findOne({
                challengeid: req.query.matchchallengeid,
                teamid: element._id,
                userid: req.user._id,
              });
              if (joindata) tempObj["isSelected"] = true;
            }
          }
        }
        let team1count = 0,
          team2count = 0,
          batsCount = 0,
          blowCount = 0,
          wicketKeeperCount = 0,
          allCount = 0;
        const players = [];
        let totalPoints = 0;
        (tempObj["overs"] = element.overs ? element.overs : ""),
          (tempObj["team1count"] = team1count);
        tempObj["jointeamid"] = element._id;
        tempObj["team2count"] = team2count;
        tempObj["batsmancount"] = batsCount;
        tempObj["bowlercount"] = blowCount;
        tempObj["wicketKeeperCount"] = wicketKeeperCount;
        tempObj["allroundercount"] = allCount;
        tempObj["total_teams"] = total_teams;
        tempObj["total_joinedcontest"] = count_JoinContest;
        tempObj["totalpoints"] = element.points;
        tempObj["player"] = players;
        finalData.push(tempObj);
        if (i == createTeams.length) {
          return {
            message: "Team Data",
            status: true,
            data: finalData,
          };
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async getMatchOverList(req){
    try {
      const {matchkey} = req.params
      if(!matchkey){
        return {
          message: "Provide matchkey",
          status: false,
          data: {},
        };
      }
const overList = await matchOverModel.find({matchId:matchkey})

if(overList.length==0){
  return {
    message: "No match overs found",
    status: false,
    data: {},
  };
}

return {
  message: "MatchOvers",
  status: true,
  data: overList,
};

    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async getAllContesttrail(req){
    try {
      const {matchkey,overId} = req.query
      if(!matchkey){
        return {
          message: "Provide matchkey",
          status: false,
          data: {},
        };
      }

      if(!overId){
        return {
          message: "Provide overId",
          status: false,
          data: {},
        };
      }
const overContest = await overContestModel.find({matchkey,overId})

if(overContest.length==0){
  return {
    message: "No over contest found",
    status: false,
    data: {},
  };
}

return {
  message: "OverContest",
  status: true,
  data: overContest,
};


    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async getAllContest(req){
    try {
      const {matchkey,overId} = req.query
      if(!matchkey){
        return {
          message: "Provide matchkey",
          status: false,
          data: {},
        };
      }

      if(!overId){
        return {
          message: "Provide overId",
          status: false,
          data: {},
        };
      }
      let finalData = [],
      contest_arr = [],
      aggpipe = [];

      aggpipe.push({
        $match: { matchkey: mongoose.Types.ObjectId(matchkey),overId: mongoose.Types.ObjectId(overId), status: "opened", is_private: 0 },
    });
    aggpipe.push({
        $lookup: {
            from: 'contestcategories',
            localField: 'contest_cat',
            foreignField: '_id',
            as: 'contestcategories'
        }
    });
    aggpipe.push({
      $sort: { "contestcategories.Order": 1, 'win_amount': -1 }
  });

const overContest = await overContestModel.aggregate(aggpipe)

// return {
//   message: "No over contest found",
//   status: false,
//   data: overContest,
// };

if(overContest.length==0){
  return {
    message: "No over contest found",
    status: false,
    data: {},
  };
}

let i = 0 

let [total_teams, total_joinedcontestData] = await Promise.all([
  JoinTeamModel.countDocuments({ userid: req.user._id, matchkey: req.query.matchkey }),
  this.getJoinleague(req.user._id, req.query.matchkey)
]);
  for await (const matchOverContest of overContest) {
    i++;
    let isselected = false,
        refercode = '',
        winners = 0;
    const price_card = [];
    const joinedleauge = await JoinLeaugeModel.find({
        matchkey: req.query.matchkey,
        challengeid: matchOverContest._id,
        userid: req.user._id,
    }).select('_id refercode');

    if (joinedleauge.length > 0) {
        refercode = joinedleauge[0].refercode;
        if (matchOverContest.multi_entry == 1 && joinedleauge.length < 11) {
            if (matchOverContest.contest_type == 'Amount') {
                if (joinedleauge.length == 11 || matchOverContest.joinedusers == matchOverContest.maximum_user)
                    isselected = true;
            } else if (matchOverContest.contest_type == 'Percentage') {
                if (joinedleauge.length == 11) isselected = true;
            } else isselected = false;
        } else isselected = true;
    }
    if (matchOverContest.matchpricecards) {
        if (matchOverContest.matchpricecards.length > 0) {
            for await (const priceCard of matchOverContest.matchpricecards) {
                winners += Number(priceCard.winners);
                const tmpObj = {
                    id: priceCard._id,
                    winners: priceCard.winners,
                    total: priceCard.total,
                };
                if ((priceCard.price && Number(priceCard.price) == 0) || priceCard.type == 'Percentage') {
                    tmpObj['price'] = (Number(priceCard.total) / Number(priceCard.winners)).toFixed(2);
                    tmpObj['price_percent'] = `${priceCard.price_percent}%`;
                } else {
                    tmpObj['gift_type'] = priceCard.gift_type;
                    if (matchOverContest.amount_type == "prize") {
                        tmpObj['price'] = priceCard.prize_name;
                        tmpObj['image'] = `${constant.BASE_URL}${priceCard.image}`;
                    } else {
                        tmpObj['price'] = Number(priceCard.price).toFixed(2);
                        tmpObj['image'] = '';
                    }
                }

                if (priceCard.min_position + 1 != priceCard.max_position) tmpObj['start_position'] = `${Number(priceCard.min_position) + 1}-${priceCard.max_position}`;
                else tmpObj['start_position'] = `${priceCard.max_position}`;
                price_card.push(tmpObj);
            }
        } else {
            price_card.push({
                id: 0,
                winners: 1,
                price: matchOverContest.win_amount,
                total: matchOverContest.win_amount,
                start_position: 1,
                image: '',
                gift_type: "amount"
            });
            winners = 1;
        }
        // console.log("------matchOverContestsData[0].matchpricecards--",matchOverContest.matchpricecards)


    } else {
        price_card.push({
            id: 0,
            winners: 1,
            price: matchOverContest.win_amount,
            total: matchOverContest.win_amount,
            start_position: 1,
        });
        winners = 1;
    }
    let gift_image = "";
    let gift_type = "amount";
    let find_gift = matchOverContest.matchpricecards.find(function (x) { return x.gift_type == "gift" });
    if (find_gift) {
        gift_image = `${constant.BASE_URL}${find_gift.image}`;
        gift_type = find_gift.gift_type;
    }
    let team_limits;
    if (matchOverContest.multi_entry == 0) {
        team_limits = 1
    } else {
        team_limits = matchOverContest.team_limit
    }
    finalData.push({
        matchOverContestid: matchOverContest._id,
        catid: matchOverContest.contest_cat ? matchOverContest.contestcategories[0]._id : '',
        cat_order: matchOverContest.contest_cat ? matchOverContest.contestcategories[0].Order : '',
        catname: matchOverContest.contest_cat ? matchOverContest.contestcategories[0].name : '',
        contest_type: matchOverContest.contest_type,
        sub_title: matchOverContest.contest_cat ? matchOverContest.contestcategories[0].sub_title : '',
        image: matchOverContest.contest_cat ? `${constant.BASE_URL}${matchOverContest.contestcategories[0].image}` : `${constant.BASE_URL}logo.png`,
        winning_percentage: matchOverContest.winning_percentage,
        entryfee: matchOverContest.entryfee,
        win_amount: matchOverContest.win_amount,
        maximum_user: matchOverContest.contest_type == 'Amount' ? matchOverContest.maximum_user : 0,
        matchkey: req.query.matchkey,
        joinedusers: matchOverContest.joinedusers,
        multi_entry: matchOverContest.multi_entry,
        // is_expert:matchOverContest.is_expert,
        // expert_name:matchOverContest.expert_name,
        confirmed_challenge: matchOverContest.confirmed_challenge,
        is_running: matchOverContest.is_running,
        is_bonus: matchOverContest.is_bonus,
        team_limit: team_limits,
        bonus_percentage: matchOverContest.bonus_percentage || 0,
        pricecard_type: matchOverContest.pricecard_type,
        isselected: isselected,
        bonus_date: '',
        isselectedid: '',
        refercode: refercode,
        totalwinners: winners,
        price_card: price_card,
        status: 1,
        joinedleauges: joinedleauge.length,
        total_joinedcontest: total_joinedcontestData || 0,
        total_teams: total_teams || 0,
        gift_image: gift_image,
        gift_type: gift_type,
    });
    //     }
    // }
    if (i == overContest.length) {
        // finalData.sort(function(a, b) {
        //     return b['win_amount'] - a['win_amount'];
        // });
        // finalData.sort(function(a, b) {
        //     return a['cat_order'] - b['cat_order'];
        // });
        // let newarr = Object.values(finalData.reduce((acc, obj) => {
        //     const key = obj['catid'];
        //     let contest = [],
        //         temObj = {}
        //     if (!acc[key]) {
        //         acc[key] = [];
        //         temObj.catid = obj.catid;
        //         temObj.catname = obj.catname;
        //         temObj.sub_title = obj.sub_title;
        //         temObj.image = obj.image;
        //         contest.push(obj);
        //         temObj.contest = contest

        //         acc[key].push(temObj)
        //     } else {
        //         acc[key][0].contest.push(obj);
        //     }

        //     return acc;
        // }, {})).flat()
        return {
            message: 'Contest of A Perticular Match',
            status: true,
            data: finalData
        }
    }
}


    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async getJoinleague(userId, matchkey) {
    const total_joinedcontestData = await JoinLeaugeModel.aggregate([
        {
            $match: {
                userid: mongoose.Types.ObjectId(userId),
                matchkey: mongoose.Types.ObjectId(matchkey)
            }
        },
        {
            $group: {
                _id: "$challengeid",
            }
        }, {
            $count: "total_count"
        }
    ])
    return total_joinedcontestData[0]?.total_count;
}

async getallplayersOverFantasy(req) {
  try {
      // await updatePlayersCount(req);
      let playerPipe = [];
      playerPipe.push({
          $match: { matchkey: mongoose.Types.ObjectId(req.params.matchId) }
      });
      playerPipe.push({
          $lookup: {
              from: 'players',
              localField: 'playerid',
              foreignField: '_id',
              as: 'playersData'
          }
      });
      playerPipe.push({
          $lookup: {
              from: 'listmatches',
              localField: 'matchkey',
              foreignField: '_id',
              as: 'listmatches'
          }
      });
      playerPipe.push({
          $unwind: { path: "$playersData" }
      });
      playerPipe.push({
          $unwind: { path: "$listmatches" }
      });
      playerPipe.push({
          $lookup: {
              from: "teams",
              localField: 'playersData.team',
              foreignField: '_id',
              as: 'team'
          }
      });
      playerPipe.push({
          $project: {
              _id: 0,
              // id: '$_id',
              playerid: '$playerid',//'$_id'
              p_id: '$_id',//'$playerid'
              points: 1,
              role: 1,
              credit: 1,
              name: 1,
              playingstatus: 1,
              vplaying: 1,
              players_key: '$playersData.players_key',
              image: {
                  $ifNull: [{
                      $cond: {
                          if: {
                              $or: [{ $eq: [{ $substr: ['$playersData.image', 0, 1] }, '/'] },
                              { $eq: [{ $substr: ['$playersData.image', 0, 1] }, 'p'] }]
                          },
                          then: { $concat: [`${constant.BASE_URL}`, '', '$playersData.image'] },
                          else: {
                              $cond: {
                                  if: { $eq: ['$playersData.image', ''] },
                                  then: {
                                      $cond: {
                                          if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                                          then: `${constant.BASE_URL}white_team1.png`,
                                          else: {
                                              $cond: {
                                                  if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                                  then: `${constant.BASE_URL}black_team1.png`,
                                                  else: `${constant.BASE_URL}black_team1.png`
                                              }
                                          }
                                      }
                                  },
                                  else: '$playersData.image'
                              }
                          }
                      }
                  }, `${constant.BASE_URL}black_team1.png`]
              },
              teamName: { $arrayElemAt: ['$team.teamName', 0] },
              teamcolor: { $ifNull: [{ $arrayElemAt: ['$team.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
              team_logo: {
                  $ifNull: [{
                      $cond: {
                          if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, 't'] }] },
                          then: { $concat: [`${constant.BASE_URL}`, '', { $arrayElemAt: ['$team.logo', 0] }] },
                          else: { $arrayElemAt: ['$team.logo', 0] },
                      }
                  }, `${constant.BASE_URL}team_image.png`]
              },
              team_short_name: { $arrayElemAt: ['$team.short_name', 0] },
              totalpoints: '0',
              team: {
                  $cond: {
                      if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                      then: 'team1',
                      else: {
                          $cond: {
                              if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                              then: 'team2',
                              else: ''
                          }
                      }
                  }
              },
              totalSelected: 1,
              vicecaptainSelected: 1,
              captainSelected: 1
          }
      })
      playerPipe.push({
          $addFields: {
              player_selection_percentage: "$totalSelected",
              captain_selection_percentage: "$captainSelected",
              vice_captain_selection_percentage: "$vicecaptainSelected"
          }
      });

      let [data, listMatchSeries] = await Promise.all([
          matchPlayersModel.aggregate(playerPipe),
          this.updateTotalPoints(req)
      ]);
      let getTeam;
      if (req.query?.teamId) {
          getTeam = await JoinTeamModel.findOne({ _id: req.query.teamId })
      }
      let myArray = [];
      let i = 0;
      let ttlCridit = 0;
      if (data.length > 0) {
          for await (let pkey of data) {
              pkey.isSelectedPlayer = false;

              if (getTeam) {
                  if (getTeam.players.includes((pkey.playerid).toString())) {
                      pkey.isSelectedPlayer = true;
                      ttlCridit = ttlCridit + pkey.credit
                  }
              }
              if (listMatchSeries.length > 0) {
                  //sahil redis
                  let getPoints = [];
                  for (let matchkey of listMatchSeries) {
                      let keyname = `matchkey-${matchkey}-playerid-${pkey.playerid}`
                      let redisdata = await Redis.getkeydata(keyname);

                      if (redisdata) {
                          getPoints.push(redisdata);
                      }
                      else {
                          getPoints = await matchPlayersModel.find({ matchkey: { $in: listMatchSeries }, playerid: pkey.playerid }, { points: 1 });
                          //let redisdata=Redis.setkeydata(keyname,getPoints,60*60*4);
                          break;
                      }
                  }
                  //sahil redis end
                  //comments for redis--> const getPoints = await matchPlayersModel.find({ matchkey: { $in: listMatchSeries }, playerid: pkey.playerid }, { points: 1 });
                  if ((getPoints || []).length > 0) {
                      getPoints.forEach((ele) => {
                          pkey.totalpoints = Number(pkey?.totalpoints || 0) + Number(ele?.points || 0)
                      });
                  }
              }
              myArray.push(pkey);
              i++;
              if (i == data.length) {
                  return {
                      message: 'Players List By Match',
                      status: true,
                      data: myArray,
                      ttlCridit: ttlCridit,
                      "sport_category": {
                          "id": 2,
                          "name": "T20",
                          "max_players": 11,
                          "max_credits": 100,
                          "min_players_per_team": 4,
                          "icon": "",
                          "category": "cricket",
                          "player_positions": [
                              {
                                  "id": 9,
                                  "sport_category_id": 2,
                                  "name": "WK",
                                  "full_name": "Wicket-Keepers",
                                  "code": "keeper",
                                  "icon": "img/wk.png",
                                  "min_players_per_team": 1,
                                  "max_players_per_team": 4
                              },
                              {
                                  "id": 10,
                                  "sport_category_id": 2,
                                  "name": "BAT",
                                  "full_name": "Batsmen",
                                  "code": "batsman",
                                  "icon": "img/bat.png",
                                  "min_players_per_team": 3,
                                  "max_players_per_team": 6
                              },
                              {
                                  "id": 11,
                                  "sport_category_id": 2,
                                  "name": "ALL",
                                  "full_name": "All-Rounders",
                                  "code": "allrounder",
                                  "icon": "img/all.png",
                                  "min_players_per_team": 1,
                                  "max_players_per_team": 4
                              },
                              {
                                  "id": 12,
                                  "sport_category_id": 2,
                                  "name": "BWL",
                                  "full_name": "Bowlers",
                                  "code": "bowler",
                                  "icon": "img/bowler.png",
                                  "min_players_per_team": 3,
                                  "max_players_per_team": 6
                              }
                          ]
                      }
                  }
              }
          }
      } else {
          return {
              message: 'Players List Not available By Match',
              status: false,
              data: []
          }
      }
  } catch (error) {
      console.log(error)
      throw error;
  }
}

async updateTotalPoints(req) {
  try {
      //sahil redis
      let keyname = `listMatchesModel-${req.params.matchId}`
      let getseries = await Redis.getkeydata(keyname);
      // let getseries;
      if (!getseries) {

          getseries = await listMatchesModel.findOne({ _id: req.params.matchId });
          let redisdata = Redis.setkeydata(keyname, getseries, 60 * 60 * 4);
      }

      //sahil redis end
      //comment for redis-->const getseries = await listMatchesModel.findOne({ _id: req.params.matchId }, { series: 1 });
      // console.log("seriessahil" + getseries)
      const listMatchSeries = await listMatchesModel.aggregate([{
          $match: { series: getseries.series, status: { $ne: "notstarted" } }
      }, {
          $group: {
              _id: null,
              matchIds: { $push: "$$ROOT._id" }
          }
      }], { _id: 1 });
      // console.log("listMatchSeries",listMatchSeries)
      return listMatchSeries?.[0]?.matchIds || [];

  } catch (error) {
      throw error;
  }
}


}
module.exports = new overfantasyServices();
