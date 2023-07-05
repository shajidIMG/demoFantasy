const pointServices = require("../services/pointService");
const mongoose = require("mongoose");

class pointController {
  constructor() {
    return {
      point_page: this.point_page.bind(this),
      addPointData: this.addPointData.bind(this),
    };
  }
  async point_page(req, res, next) {
    try {
      const getPointToDb = await pointServices.getPointToDb(req);
      // console.log("getPointToDb.......",getPointToDb)
      res.render("points/addPointer", {
        sessiondata: req.session.data,
        data: getPointToDb,
      });
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/");
    }
  }
  async addPointData(req, res, next) {
    try {
      const updatepoint = await pointServices.updatePoint(req);
      if (updatepoint.status == true) {
        req.flash("success", updatepoint.message);
        res.redirect("/point");
      } else {
        req.flash("error", updatepoint.message);
        res.redirect("/point");
      }
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new pointController();
