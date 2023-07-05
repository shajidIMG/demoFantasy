const matchServices = require("../services/matchServices");
const listMatchesModel = require("../../models/listMatchesModel");
const overfantasyServices = require("../services/overFantasyServices");
class matchController {
  constructor() {
    return {
      overfantasy_getmatchlist: this.overfantasy_getmatchlist.bind(this),
      overfantasy_Newjoinedmatches:
        this.overfantasy_Newjoinedmatches.bind(this),
      OverfantasyAllCompletedMatches:
        this.OverfantasyAllCompletedMatches.bind(this),
      overfantasy_createTeam: this.overfantasy_createTeam.bind(this),
      overGetMyTeams: this.overGetMyTeams.bind(this),
      overInformations: this.overInformations.bind(this),
      overviewTeam: this.overviewTeam.bind(this),
      overlivematches: this.overlivematches.bind(this),
      overfantasy_matchOverList: this.overfantasy_matchOverList.bind(this),
      overfantasy_allOverContest: this.overfantasy_allOverContest.bind(this),
      getallplayersOverFantasy: this.getallplayersOverFantasy.bind(this),
      
    };
  }

  async overfantasy_getmatchlist(req, res, next) {
    try {
      const upcomingMatches =
        await overfantasyServices.overfantasy_getmatchlist(req);
      // console.log(`upcomingMatches`, upcomingMatches);
      const joinedMatches = await overfantasyServices.latestJoinedMatches(req);
      // console.log("joinedMatches_-----------------",joinedMatches)

      let final = {
        message: "all match data",
        status: true,
        data: {
          upcomingMatches,
          joinedMatches,
        },
      };
      return res.status(200).json(Object.assign({ success: true }, final));
    } catch (error) {
      next(error);
    }
  }

  async overfantasy_matchOverList(req, res, next) {
    try {
      const data =
        await overfantasyServices.getMatchOverList(req);

      let final = {
        message: data.message,
        status: data.status,
        data: data.data,
      };
      return res.status(200).json(Object.assign({ success: true }, final));
    } catch (error) {
      next(error);
    }
  }
  
  async overfantasy_allOverContest(req, res, next) {
    try {
      const data =
        await overfantasyServices.getAllContest(req);

      let final = {
        message: data.message,
        status: data.status,
        data: data.data,
      };
      return res.status(200).json(Object.assign({ success: true }, final));
    } catch (error) {
      next(error);
    }
  }

  async overfantasy_allOverContesttrail(req, res, next) {
    try {
      const data =
        await overfantasyServices.getAllContesttrail(req);

      let final = {
        message: data.message,
        status: data.status,
        data: data.data,
      };
      return res.status(200).json(Object.assign({ success: true }, final));
    } catch (error) {
      next(error);
    }
  }

  async overfantasy_Newjoinedmatches(req, res, next) {
    try {
      const data = await overfantasyServices.overfantasy_Newjoinedmatches(req);
      return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
      console.log(error);
    }
  }
  async OverfantasyAllCompletedMatches(req, res, next) {
    try {
      const data = await overfantasyServices.OverfantasyAllCompletedMatches(
        req
      );
      return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
      next(error);
    }
  }

  async overfantasy_createTeam(req, res, next) {
    try {
      const data = await overfantasyServices.overfantasy_createTeam(req);
      return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
      next(error);
    }
  }

  async overInformations(req, res, next) {
    try {
      const data = await overfantasyServices.overInformations(req);
      return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
      next(error);
    }
  }
  async overviewTeam(req, res, next) {
    try {
      const data = await overfantasyServices.overviewTeam(req);
      return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
      next(error);
    }
  }
  async overlivematches(req, res, next) {
    try {
      const data = await overfantasyServices.overlivematches(req);
      return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
      next(error);
    }
  }
  async overGetMyTeams(req, res, next) {
    try {
      const data = await overfantasyServices.overGetMyTeams(req);
      if (data.status === false) {
        return res.status(200).json(Object.assign({ success: true }, data));
      } else {
        return res
          .status(200)
          .json(Object.assign({ success: data.status }, data));
      }
    } catch (error) {
      next(error);
    }
  }

  async getallplayersOverFantasy(req, res, next) {
    try {
      const data = await overfantasyServices.getallplayersOverFantasy(req);
      if (data.status === false) {
        return res
          .status(200)
          .json(Object.assign({ success: data.status }, data));
      } else {
        return res
          .status(200)
          .json(Object.assign({ success: data.status }, data));
      }
    } catch (error) {
      next(error);
    }
  } 
}
module.exports = new matchController();
