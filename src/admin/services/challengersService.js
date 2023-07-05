const res = require('express/lib/response');
const mongoose = require('mongoose');
const moment = require('moment');
const fs = require("fs");
const randomstring = require("randomstring");
const joinBoatUserService = require("../services/botUserService");
const contestCategoryModel = require("../../models/contestcategoryModel");
const challengersModel = require("../../models/challengersModel");
const priceCardModel = require("../../models/priceCardModel");
const listMatchesModel = require("../../models/listMatchesModel");
const matchchallengersModel = require("../../models/matchChallengersModel");
const JoinLeaugeModel = require("../../models/JoinLeaugeModel");
const JoinTeamModel = require("../../models/JoinTeamModel");
const matchPlayerModel = require("../../models/matchPlayersModel");
const playerModel = require("../../models/playerModel");
const teamModel = require("../../models/teamModel");
const refundMatchModel = require("../../models/refundModel");
const userModel = require("../../models/userModel");
const TransactionModel = require("../../models/transactionModel");
const { deleteMany } = require('../../models/challengersModel');
const config = require("../../config/const_credential");
const constant = require("../../config/const_credential");
const Redis = require('../../utils/redis');
const overContestModel = require('../../models/overContestModel');
const matchOverModel = require('../../models/matchOverModel');
class challengersService {
    constructor() {
        return {
            getContest: this.getContest.bind(this),
            addGlobalchallengersData: this.addGlobalchallengersData.bind(this),
            priceCardChallengers: this.priceCardChallengers.bind(this),
            editglobalcontest: this.editglobalcontest.bind(this),
            editGlobalContestData: this.editGlobalContestData.bind(this),
            deleteGlobalChallengers: this.deleteGlobalChallengers.bind(this),
            globalcatMuldelete: this.globalcatMuldelete.bind(this),
            addpriceCard_Post: this.addpriceCard_Post.bind(this),
            addpricecardPostbyPercentage: this.addpricecardPostbyPercentage.bind(this),
            deletepricecard_data: this.deletepricecard_data.bind(this),
            importchallengersData: this.importchallengersData.bind(this),
            createCustomContest: this.createCustomContest.bind(this),
            add_CustomContest: this.add_CustomContest.bind(this),
            addCustom_contestData: this.addCustom_contestData.bind(this),
            // addMatchPriceCard_page: this.addMatchPriceCard_page.bind(this),
            editcustomcontest_page: this.editcustomcontest_page.bind(this),
            editcustomcontest_data: this.editcustomcontest_data.bind(this),
            delete_customcontest: this.delete_customcontest.bind(this),
            makeConfirmed: this.makeConfirmed.bind(this),
            addEditmatchpricecard: this.addEditmatchpricecard.bind(this),
            addEditPriceCard_Post: this.addEditPriceCard_Post.bind(this),
            deleteMatchPriceCard: this.deleteMatchPriceCard.bind(this),
            addEditPriceCardPostbyPercentage: this.addEditPriceCardPostbyPercentage.bind(this),
            getTeamNameContestExports: this.getTeamNameContestExports.bind(this),
            contestCancel: this.contestCancel.bind(this),
            joinedBotUser: this.joinedBotUser.bind(this),

            // ------------exports contest------------------

            viewAllExportsContests: this.viewAllExportsContests.bind(this),
            addExpertContestPage: this.addExpertContestPage.bind(this),
            addExpertContestData: this.addExpertContestData.bind(this),
            editExpertContest: this.editExpertContest.bind(this),
            editExpertContestData: this.editExpertContestData.bind(this),

        }
    }
    // --------------------
    async getContest(req) {
        try {

            const getContest = await contestCategoryModel.find({}, { name: 1 });
            if (getContest) {
                return {
                    status: true,
                    data: getContest
                }
            } else {
                return {
                    status: false,
                    message: 'data not found'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async addGlobalchallengersData(req) {
        try {
            if (req.body.entryfee || req.body.entryfee == '0' && req.body.win_amount || req.body.win_amount == '0' && req.body.contest_type && req.body.contest_cat) {
                // const checkContestName=await challengersModel.findOne({contest_name:req.body.contest_name});
                // if(checkContestName){
                //     return {
                //         status: false,
                //         message: 'Contest Name already exist..'
                //     }
                // }
                const checkData = await challengersModel.findOne({ amount_type: req.body.amount_type, entryfee: req.body.entryfee, win_amount: req.body.win_amount, contest_type: req.body.contest_type, contest_cat: req.body.contest_cat, is_deleted: false });
                // const checkData = await challengersModel.find({amount_type:req.body.amount_type,entryfee: req.body.entryfee, win_amount: req.body.win_amount, contest_type: req.body.contest_type, contest_cat: req.body.contest_cat, is_deleted: false });
                let data = {}
                // if (Number(req.body.entryfee) == 0 || Number(req.body.win_amount) == 0) {
                //     return {
                //         status: false,
                //         message: 'entryfee or win_amount can not equal to Zero'
                //     }
                // }

                // checkData.forEach(element => {
                //     if (element.contest_name==req.body.contest_name) {
                //         console.log("check Data.'please name'");
                //         return {
                //             status: false,
                //             message: 'please name'
                //         }
                //     }
                // });
                // if (checkData.contest_name == req.body.contest_name) {
                //     // console.log("check Data.. found");
                //     return {
                //         status: false,
                //         message: 'This contest is already exist with the same winning amount, entry fees and maximum number ,contest type ...'
                //     }
                // } else {
                if (req.body.team_limit) {
                    // console.log(`....................................${req.body.team_limit}.....................//////////////////////////${Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)}.............//////////////////////////////////////////${process.env.TEAM_LIMIT}/////////////`)
                    if (Number(req.body.team_limit) == 0 || Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)) {
                        // console.log("team_limit == 0. found");
                        return {
                            status: false,
                            message: `Value of Team limit not equal to 0..or more then ${config.TEAM_LIMIT}.`
                        }
                    } else {
                        data.multi_entry = 1;
                    }
                }
                if (req.body.maximum_user) {
                    if (req.body.maximum_user < 2) {
                        // console.log("maximum_user < 2 found");
                        return {
                            status: false,
                            message: 'Value of maximum user not less than 2...'
                        }
                    }
                }
                if (req.body.winning_percentage) {
                    if (req.body.winning_percentage == 0) {
                        // console.log("winning_percentage == 0. found");
                        return {
                            status: false,
                            message: 'Value of winning percentage not equal to 0...'
                        }
                    }
                }
                if (req.body.bonus_percentage) {
                    if (req.body.bonus_percentage == 0) {
                        // console.log("bonus_percentage == 0. found");
                        return {
                            status: false,
                            message: 'Value of bonus percentage not equal to 0...'
                        }
                    }
                }
                if (!req.body.bonus_percentage) {
                    // console.log("..!req.body.bonus_percentage found");
                    data.bonus_percentage = 0
                    data.is_bonus = 0;
                }
                if (req.body.contest_type == 'Percentage') {
                    // console.log("..contest_type == 'Percentage' found");
                    req.body.maximum_user = '0';
                    req.body.pricecard_type = '0';
                }
                if (req.body.maximum_user) {
                    // console.log("..maximum_user' found");
                    data.maximum_user = req.body.maximum_user;
                }

                if (req.body.winning_percentage) {
                    // console.log("..winning_percentage.. found");
                    data.winning_percentage = req.body.winning_percentage;
                }

                if (req.body.confirmed_challenge) {
                    // console.log("..confirmed_challenge.. found");
                    data.confirmed_challenge = 1;
                } else {
                    if (req.body.contest_type == 'Amount' && req.body.pricecard_type == 'Percentage') {
                        // console.log("..contest_type == 'Amount'.. found");
                        data.confirmed_challenge = 1;
                    }
                }

                if (req.body.is_running) {
                    // console.log("...is_running'.. found");
                    data.is_running = 1;
                }
                if (req.body.is_bonus) {
                    // console.log("....is_bonus'.. found");
                    data.is_bonus = 1;
                    data.bonus_percentage = req.body.bonus_percentage;
                }
                if (req.body.multi_entry) {
                    data.multi_entry = 1;
                    data.multi_entry = req.body.multi_entry;
                    data.team_limit = req.body.team_limit;
                }
                data.contest_type = req.body.contest_type;
                data.pricecard_type = req.body.pricecard_type;
                data.contest_cat = req.body.contest_cat;
                data.contest_name = req.body.contest_name;
                data.entryfee = req.body.entryfee;
                data.fantasy_type = req.body.fantasy_type;
                data.win_amount = req.body.win_amount;
                data.amount_type = req.body.amount_type;
                console.log('data-->', data);
                if (req.body.contest_type == 'Amount') {
                    data.winning_percentage = '0';
                }

                // console.log("data.....insert Cahlengers......", data)
                const insertChallengers = new challengersModel(data);
                const saveInsert = await insertChallengers.save();
                if (saveInsert) {
                    return {
                        status: true,
                        renderStatus: req.body.contest_type,
                        data: saveInsert,
                        message: 'Contest Create successfully'
                    };
                }

                // }

            } else {
                return {
                    status: false,
                    message: 'please fill ..Entry Fee & win Amount & Contest Type & Contest Category '
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async priceCardChallengers(req) {
        try {
            console.log("req.query,req.params..................", req.query, req.params)
            if (req.params) {
                const challenger_Details = await challengersModel.findOne({ _id: req.params.id, is_deleted: false });
                if (challenger_Details) {
                    console.log("challenger_Details..........", challenger_Details)
                    const contest_Name = await contestCategoryModel.findById({ _id: challenger_Details.contest_cat, is_deleted: false }, { name: 1, _id: 0 });
                    if (contest_Name) {
                        console.log("contest_Name..........", contest_Name)
                        const check_PriceCard = await priceCardModel.find({ challengersId: req.params.id, is_deleted: false });
                        console.log("check_PriceCard.....", check_PriceCard);
                        let totalAmountForPercentage = 0;

                        if (check_PriceCard.length == 0) {
                            let position = 0;
                            return {
                                status: true,
                                challenger_Details,
                                contest_Name,
                                position,
                                totalAmountForPercentage,
                                amount_type: challenger_Details.amount_type
                            }
                        } else {
                            let lastIndexObject = (check_PriceCard.length) - 1;
                            // console.log("lastIndexObject............",lastIndexObject)
                            let lastObject = check_PriceCard[lastIndexObject];
                            // console.log("lastObject.............", lastObject)
                            let position = lastObject.max_position
                            for (let key of check_PriceCard) {
                                totalAmountForPercentage = totalAmountForPercentage + key.total
                            }
                            // console.log("position..........price card checked..",position)
                            return {
                                status: true,
                                challenger_Details,
                                contest_Name,
                                position,
                                check_PriceCard,
                                totalAmountForPercentage,
                                amount_type: challenger_Details.amount_type
                            }
                        }

                    } else {
                        return {
                            status: false,
                            message: 'contest not found in challenges ..'
                        }
                    }

                } else {
                    return {
                        status: false,
                        message: 'challenge not found..'
                    }
                }

            } else {
                return {
                    status: false,
                    message: 'Invalid request Id'
                }
            }



        } catch (error) {
            throw error;
        }
    }

    async addpriceCard_Post(req) {
        try {
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }
            }

            if (req.body.typename == "prize" && req.body.gift_type == "gift") {
                req.body.price = 0;
                if (!req.file || !req.body.prize_name) {
                    return {
                        status: false,
                        message: "Please Fill Prize Name && Image "
                    }
                }
            }
            if (req.body.gift_type == "amount") {
                if (req.body.price <= 0 || !req.body.price) {
                    return {
                        status: false,
                        message: 'price should not zero..'
                    }
                }
            }

            const challenger_Details = await challengersModel.findOne({ _id: mongoose.Types.ObjectId(req.body.globelchallengersId) });


            const check_PriceCard = await priceCardModel.find({ challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId) });

            if (req.body.min_position && req.body.winners) {


                if (req.body.typename != "prize") {
                    if (Number(req.body.winners) == 0 || Number(req.body.price) == 0) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        return {
                            status: false,
                            message: 'winners or price can not equal to Zero'
                        }
                    }
                }

                if (check_PriceCard.length == 0) {
                    if (challenger_Details.win_amount < ((Number(req.body.winners)) * (Number(req.body.price)))) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        return {
                            status: false,
                            message: 'price should be less or equal challengers winning amount'
                        }
                    } else if (challenger_Details.maximum_user < Number(req.body.winners)) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'number of Winner should be less or equal challengers maximum user'
                        }
                    } else {

                        let obj = {
                            challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                            winners: Number(req.body.winners),
                            price: Number(req.body.price),
                            min_position: Number(req.body.min_position),
                            max_position: (Math.abs((Number(req.body.min_position)) - (Number(req.body.winners)))),
                            total: ((Number(req.body.winners)) * (Number(req.body.price))).toFixed(2),
                            type: 'Amount'
                        }
                        if (req.file) {
                            obj.image = `/${req.body.typename}/${req.file.filename}`,
                                obj.gift_type = "gift"
                        } else {
                            obj.gift_type = "amount"
                        }
                        if (req.body.prize_name) {
                            obj.prize_name = req.body.prize_name;
                        }
                        console.log("../////___1st >> insert..Obj.--->", obj)

                        const insertPriceData = new priceCardModel(obj)
                        let savePriceData = await insertPriceData.save();
                        if (savePriceData) {
                            return {
                                status: true,
                                message: 'price Card added successfully'
                            };
                        }
                    }


                } else {

                    let lastIndexObject = (check_PriceCard.length) - 1;

                    let lastObject = check_PriceCard[lastIndexObject];

                    let position = lastObject.max_position

                    let totalAmountC = 0;
                    for (let key of check_PriceCard) {
                        totalAmountC = totalAmountC + key.total
                    }
                    if (!req.body.typename && req.body.typename != "prize") {
                        if ((totalAmountC + ((Number(req.body.price) * (Number(req.body.winners))))) > challenger_Details.win_amount) {
                            if (req.file) {
                                let filePath = `public/${req.body.typename}/${req.file.filename}`;
                                if (fs.existsSync(filePath) == true) {
                                    fs.unlinkSync(filePath);
                                }
                            }
                            return {
                                status: false,
                                message: 'price should be less or equal to challenge winning Amount'
                            }
                        }
                    }
                    if (challenger_Details.maximum_user < (position + Number(req.body.winners))) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'number of Winner should be less or equal challengers maximum user'
                        }
                    } else {
                        let obj = {
                            challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                            winners: Number(req.body.winners),
                            price: Number(req.body.price),
                            min_position: position,
                            max_position: ((Number(req.body.min_position)) + (Number(req.body.winners))),
                            total: ((Number(req.body.winners)) * (Number(req.body.price))).toFixed(2),
                            type: 'Amount'
                        }
                        if (req.file) {
                            obj.image = `/${req.body.typename}/${req.file.filename}`,
                                obj.gift_type = "gift"
                        } else {
                            obj.gift_type = "amount"
                        }
                        if (req.body.prize_name) {
                            obj.prize_name = req.body.prize_name;
                        }
                        console.log("---obj insert--- 2---->>", obj)
                        const insertPriceData = new priceCardModel(obj)
                        let savePriceData = await insertPriceData.save();
                        if (savePriceData) {
                            return {
                                status: true,
                                message: 'price Card added successfully'
                            };
                        }
                    }

                }

            }

        } catch (error) {
            throw error;
        }
    }

    async editglobalcontest(req) {
        try {
            if (req.params.id) {

                const globalcontestdata = await challengersModel.aggregate([{
                    $match: {
                        "_id": mongoose.Types.ObjectId(req.params.id)
                    }
                }, {
                    $lookup: {
                        from: 'contestcategories',
                        localField: 'contest_cat',
                        foreignField: '_id',
                        as: 'contentCatName'
                    }
                }, {
                    $unwind: "$contentCatName"
                }])
                if (globalcontestdata.length > 0) {
                    const getContest = await contestCategoryModel.find({ is_deleted: false }, { name: 1 });
                    // console.log("globalcontestdata............", globalcontestdata)
                    if (getContest.length > 0) {
                        return {
                            status: true,
                            challengersData: globalcontestdata[0], getContest
                        };
                    } else {
                        return {
                            status: false,
                            message: 'contest Category not found..'
                        }
                    }
                } else {
                    return {
                        status: false,
                        message: 'challenge && contest category not found.. '
                    }
                }


            } else {
                return {
                    status: false,
                    message: 'Invalid contest Id'
                }
            }


        } catch (error) {
            throw error;
        }
    }
    async editGlobalContestData(req) {
        try {
            if (req.body.entryfee && req.body.win_amount && req.body.contest_type && req.body.contest_cat) {
                // const checkContestName=await challengersModel.findOne({_id:{$ne: req.body.globelContestsId},contest_name:req.body.contest_name});
                // if(checkContestName){
                //     return {
                //         status: false,
                //         message: 'Contest Name already exist..'
                //     }
                // }
                if (Number(req.body.entryfee) == 0 || Number(req.body.win_amount) == 0 || Number(req.body.maximum_user) == 0) {
                    return {
                        status: false,
                        message: 'entryfee or win amount or maximum user can not equal to Zero'
                    }
                }
                let data = {}
                // console.log("req.body", req.body, "req.params", req.params, "req.query", req.query)
                const challengerData = await challengersModel.findOne({ _id: req.body.globelContestsId });
                // console.log("challengerData......................", challengerData)
                const checkData = await challengersModel.findOne({ _id: { $ne: req.body.globelContestsId }, entryfee: req.body.entryfee, win_amount: req.body.win_amount, contest_type: req.body.contest_type, contest_cat: req.body.contest_cat, is_deleted: false });

                if (checkData) {
                    // console.log("check Data.. found");
                    return {
                        status: false,
                        message: 'This contest is already exist with the same winning amount, entry fees and maximum number ,contest type ...'
                    }
                } else {
                    if (req.body.team_limit) {
                        if (Number(req.body.team_limit) == 0 || Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)) {
                            // console.log("team_limit == 0. found");
                            return {
                                status: false,
                                message: `Value of Team limit not equal to 0..or more then ${config.TEAM_LIMIT}.`
                            }
                        } else {
                            data.multi_entry = 1;
                        }
                    }

                    if (req.body.multi_entry) {
                        req.body.multi_entry = 1;
                    } else {
                        req.body.multi_entry = 0;
                    }
                    if (req.body.confirmed_challenge) {
                        req.body.confirmed_challenge = 1;
                    } else {
                        req.body.confirmed_challenge = 0;
                    }

                    if (req.body.is_running) {
                        req.body.is_running = 1;
                    } else {
                        req.body.is_running = 0;
                    }


                    if (req.body.maximum_user) {
                        if (req.body.maximum_user < 2) {
                            // console.log("maximum_user < 2 found");
                            return {
                                status: false,
                                message: 'Value of maximum user not less than 2...'
                            }
                        }
                    }
                    if (req.body.winning_percentage) {
                        if (req.body.winning_percentage == 0) {
                            // console.log("winning_percentage == 0. found");
                            return {
                                status: false,
                                message: 'Value of winning percentage not equal to 0...'
                            }
                        }
                    }
                    if (req.body.bonus_percentage) {
                        if (req.body.bonus_percentage == 0) {
                            // console.log("bonus_percentage == 0. found");
                            return {
                                status: false,
                                message: 'Value of bonus percentage not equal to 0...'
                            }
                        }
                    }
                    if (!req.body.bonus_percentage) {
                        // console.log("..!req.body.bonus_percentage found");
                        req.body.bonus_percentage = 0
                        req.body.is_bonus = 0;
                    }
                    if (!req.body.maximum_user) {
                        req.body.maximum_user = 0
                    }
                    if (!req.body.winning_percentage) {
                        req.body.winning_percentage = 0;
                    }
                    if (Number(req.body.win_amount) != Number(challengerData.win_amount)) {
                        // console.log("delete Price Card By win_Amount")
                        const deletepriceCard = await priceCardModel.deleteMany({ challengersId: challengerData._id });
                        // console.log("deletepriceCard..", deletepriceCard)
                    }
                    if (req.body.contest_type == 'Percentage') {
                        // console.log("..contest_type == 'Percentage' found");
                        req.body.maximum_user = 0;
                        req.body.pricecard_type = 0;
                        const checkPriceCard = await priceCardModel.findOne({ challengersId: challengerData._id });
                        if (checkPriceCard) {
                            const deletepriceCard = await priceCardModel.deleteMany({ challengersId: challengerData._id });
                        }
                    }
                    if (req.body.contest_type == 'Amount') {
                        if (!req.body.pricecard_type) {
                            req.body.pricecard_type = 'Amount'
                        }
                        req.body.winning_percentage = 0
                    }
                    if (req.body.maximum_user) {
                        // console.log("..maximum_user' found");
                        data.maximum_user = req.body.maximum_user;
                    }

                    if (req.body.winning_percentage) {
                        // console.log("..winning_percentage.. found");
                        data.winning_percentage = req.body.winning_percentage;
                    }

                    if (req.body.confirmed_challenge) {
                        // console.log("..confirmed_challenge.. found");
                        data.confirmed_challenge = 1;
                    } else {
                        data.confirmed_challenge = 0;
                    }

                    if (req.body.is_running) {
                        // console.log("...is_running'.. found");
                        data.is_running = 1;
                    } else {
                        data.is_running = 0;
                    }
                    if (req.body.is_bonus) {
                        // console.log("....is_bonus'.. found");
                        data.is_bonus = 1;
                        data.bonus_percentage = req.body.bonus_percentage;
                    } else {
                        data.is_bonus = 0;
                        data.bonus_percentage = 0;
                    }
                    if (req.body.multi_entry) {
                        data.multi_entry = 1;
                        data.multi_entry = req.body.multi_entry;
                        data.team_limit = req.body.team_limit;
                    } else {
                        data.multi_entry = 0;
                    }
                    if (Number(req.body.maximum_user) != Number(challengerData.maximum_user)) {
                        const checkPriceCard = await priceCardModel.findOne({ challengersId: challengerData._id });
                        if (checkPriceCard) {
                            const deletepriceCard = await priceCardModel.deleteMany({ challengersId: challengerData._id });
                        }
                    }
                    if (req.body.pricecard_type != challengerData.pricecard_type) {
                        const checkPriceCard = await priceCardModel.findOne({ challengersId: challengerData._id });
                        if (checkPriceCard) {
                            const deletepriceCard = await priceCardModel.deleteMany({ challengersId: challengerData._id });
                        }
                    }
                    data.contest_type = req.body.contest_type;
                    data.pricecard_type = req.body.pricecard_type;
                    data.contest_cat = req.body.contest_cat;
                    data.contest_name = req.body.contest_name;
                    data.entryfee = req.body.entryfee;
                    data.win_amount = req.body.win_amount;
                    data.fantasy_type = req.body.fantasy_type;
                    data.amount_type = req.body.amount_type;
                    if (req.body.contest_type == 'Amount') {
                        data.winning_percentage = 0;
                    }
                    // console.log("data................", data)
                    const updateChallengers = await challengersModel.updateOne({ _id: mongoose.Types.ObjectId(req.body.globelContestsId) }, { $set: data });
                    if (updateChallengers.modifiedCount > 0) {
                        return {
                            status: true,
                            message: 'globel centest successfully update'
                        };
                    } else {
                        return {
                            status: false,
                            message: "Not Able To Update Globel Contest  ..ERROR.."
                        }
                    }
                }

            }


        } catch (error) {
            throw error;
        }
    }
    async deleteGlobalChallengers(req) {
        try {

            const deleteChallenger = await challengersModel.deleteOne({ _id: req.query.globelContestsId });
            if (deleteChallenger.deletedCount == 1) {
                const deletePriceCard = await priceCardModel.deleteMany({ challengersId: req.query.globelContestsId });


                return true;
            } else {
                return false;
            }

        } catch (error) {
            throw error;
        }
    }
    async globalcatMuldelete(req) {
        try {

            let deleteIds = req.body.deletedId;
            for (let key of deleteIds) {
                const deleteChallenger = await challengersModel.deleteOne({ _id: mongoose.Types.ObjectId(key) })
                const deletePriceCard = await priceCardModel.deleteMany({ challengersId: mongoose.Types.ObjectId(key) });

            }
            if (deleteIds.length == 0) {
                return true;
            }

        } catch (error) {
            throw error;
        }
    }
    async addpricecardPostbyPercentage(req) {
        try {

            const challenger_Details = await challengersModel.findOne({ _id: req.body.globelchallengersId });
            if (Number(req.body.price_percent) == 0 || Number(req.body.winners) == 0) {
                return {
                    status: false,
                    message: 'price percent or winners can not equal to Zero'
                }
            }
            const check_PriceCard = await priceCardModel.find({ challengersId: req.body.globelchallengersId });
            let min_position = req.body.min_position;
            let winners
            let price_percent
            let price
            if (req.body.Percentage) {
                if (req.body.user_selection == 'number') {
                    winners = Number(req.body.winners);
                    price_percent = (Number(req.body.price_percent));
                    price = ((challenger_Details.win_amount) * ((Number(req.body.price_percent)) / 100)).toFixed(2);
                    // console.log('.......in Number.EPSILON..........', winners, price_percent, price)
                } else {
                    winners = ((challenger_Details.maximum_user) * ((Number(req.body.winners)) / 100)).toFixed(2)
                    price_percent = (Number(req.body.price_percent));
                    price = ((challenger_Details.win_amount) * ((Number(req.body.price_percent)) / 100)).toFixed(2);
                    // console.log('.......in percentegae.EPSILON..........', winners, price_percent, price)
                }
            } else {
                return {
                    status: false,
                    message: 'is not Percentage'
                }
            }
            if (min_position && winners && price_percent) {
                if (winners <= 0) {
                    return {
                        status: false,
                        message: 'winner should not equal or less then zero'
                    }
                }
                if (min_position && winners && price_percent) {
                    if (check_PriceCard.length == 0) {
                        if (challenger_Details.win_amount < ((Number(winners)) * (Number(price)))) {
                            return {
                                status: false,
                                message: 'price should be less or equal challengers winning amount'
                            }
                        } else if (challenger_Details.maximum_user < Number(winners)) {
                            return {
                                status: false,
                                message: 'number of Winner should be less or equal challengers maximum user'
                            }
                        } else {
                            console.log("......insertPriceData........../////////////////////////////////////.")
                            let obj = {
                                challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                                winners: (Number(winners)) || 0,
                                price: (Number(price)) || 0,
                                price_percent: (Number(price_percent)) || 0,
                                min_position: (Number(min_position)) || 0,
                                max_position: (Math.abs((Number(min_position)) - (Number(winners)))) || 0,
                                total: ((Number(winners)) * (Number(price))) || 0,
                                type: 'Amount'
                            }
                            if (req.file) {
                                obj.image = `/${req.body.typename}/${req.file.filename}`
                            }
                            const insertPriceData = new priceCardModel(obj)
                            let savePriceData = await insertPriceData.save();
                            if (savePriceData) {
                                return {
                                    status: true,
                                    message: 'price Card added successfully'
                                };
                            }
                        }


                    } else {

                        let lastIndexObject = (check_PriceCard.length) - 1;
                        // console.log("lastIndexObject.........",lastIndexObject)
                        let lastObject = check_PriceCard[lastIndexObject];
                        // console.log("lastObject........",lastObject);
                        let position = lastObject.max_position

                        let totalAmountC = 0;
                        for (let key of check_PriceCard) {
                            totalAmountC = totalAmountC + key.total
                        }
                        if ((totalAmountC + ((Number(price) * (Number(winners))))) > challenger_Details.win_amount) {
                            return {
                                status: false,
                                message: 'price should be less or equal to challengers winning Amount'
                            }
                        } else if (challenger_Details.maximum_user < (position + Number(winners))) {
                            return {
                                status: false,
                                message: 'number of Winner should be less or equal challengers maximum user'
                            }
                        } else {

                            let obj = {
                                challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                                winners: (Number(winners)) || 0,
                                price: (Number(price)) || 0,
                                price_percent: (Number(price_percent)) || 0,
                                min_position: (position) || 0,
                                max_position: ((Number(min_position)) + (Number(winners))) || 0,
                                total: ((Number(winners)) * (Number(price))) || 0,
                                type: 'Amount'
                            };

                            if (req.file) {
                                obj.image = `/${req.body.typename}/${req.file.filename}`
                            }
                            const insertPriceData = new priceCardModel(obj)
                            let savePriceData = await insertPriceData.save();
                            if (savePriceData) {
                                return {
                                    status: true,
                                    message: 'price Card added successfully'
                                }
                            } else {
                                return {
                                    status: false,
                                    message: 'data not insert ..error..'
                                }
                            }
                        }

                    }

                }
            } else {
                return {
                    status: false,
                    message: 'please enter proper values'
                }
            }

        } catch (error) {
            return true;
        }
    }
    async deletepricecard_data(req) {
        try {
            const _checkData = await priceCardModel.findOne({ _id: req.params.id });
            if (!_checkData) {
                return {
                    status: false,
                    message: "something wrong please try letter.."
                }
            } else {
                if (_checkData.image) {
                    let filePath = `public${_checkData.image}`;
                    if (fs.existsSync(filePath) == true) {
                        fs.unlinkSync(filePath);
                    }
                }
                const deletequery = await priceCardModel.deleteOne({ _id: req.params.id });
                if (deletequery.deletedCount == 1) {
                    return {
                        status: true,
                        message: 'delete successfully'
                    }
                } else if (deletequery.deletedCount == 0) {
                    return {
                        status: false,
                        message: 'unable to delete'
                    }
                }
            }


        } catch (error) {
            throw error;
        }
    }
    // async createCustomContest(req) {
    //     try {
    //         let curTime = moment().format("YYYY-MM-DD HH:mm:ss");

    //         const getLunchedMatch = await listMatchesModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } }, { fantasy_type: 1, name: 1 });

    //         let getlistofMatches
    //         let anArray = [];
    //         if (req.query.matchkey) {
    //             let qukey = req.query.matchkey
    //             let objfind = {};
    //             objfind.matchkey = mongoose.Types.ObjectId(qukey)
    //             if (req.query.entryfee && req.query.entryfee != "") {
    //                 objfind.entryfee = Number(req.query.entryfee)
    //             }
    //             if (req.query.win_amount && req.query.win_amount != "") {
    //                 objfind.win_amount = Number(req.query.win_amount)
    //             }
    //             if (req.query.team_limit && req.query.team_limit != "") {
    //                 objfind.team_limit = Number(req.query.team_limit)
    //             }
    //             console.log('objfind', objfind);
    //             getlistofMatches = await matchchallengersModel.find(objfind);
    //             // console.log("getlistofMatches.....>",getlistofMatches)
    //             for await (let keyy of getlistofMatches) {
    //                 let obj = {};
    //                 let newDate = moment(keyy.createdAt).format('MMM Do YY');
    //                 let day = moment(keyy.createdAt).format('dddd');
    //                 let time = moment(keyy.createdAt).format('h:mm:ss a');
    //                 if (keyy.is_expert == 1) {
    //                     obj.newDate = newDate;
    //                     obj.day = day;
    //                     obj.time = time;
    //                     obj.contest_cat = keyy.contest_cat;
    //                     obj.matchkey = keyy.matchkey;
    //                     obj.fantasy_type = keyy.fantasy_type
    //                     obj.entryfee = keyy.entryfee;
    //                     obj.win_amount = keyy.win_amount;
    //                     obj.status = keyy.status;
    //                     obj.contest_type = keyy.contest_type;
    //                     obj.winning_percentage = keyy.winning_percentage;
    //                     obj.is_bonus = keyy.is_bonus;
    //                     obj.bonus_percentage = keyy.bonus_percentage;
    //                     obj.amount_type = keyy.amount_type;
    //                     obj.c_type = keyy.c_type;
    //                     obj.is_private = keyy.is_private;
    //                     obj.is_running = keyy.is_running;
    //                     obj.confirmed_challenge = keyy.confirmed_challenge;
    //                     obj.multi_entry = keyy.multi_entry;
    //                     obj._id = keyy._id;
    //                     obj.joinedusers = keyy.joinedusers;
    //                     obj.team_limit = keyy.team_limit;

    //                 } else {
    //                     obj.newDate = newDate;
    //                     obj.day = day;
    //                     obj.time = time;
    //                     obj._id = keyy._id;
    //                     obj.contest_cat = keyy.contest_cat;
    //                     obj.challenge_id = keyy.challenge_id;
    //                     obj.matchkey = keyy.matchkey;
    //                     obj.fantasy_type = keyy.fantasy_type;
    //                     obj.entryfee = keyy.entryfee;
    //                     obj.win_amount = keyy.win_amount;
    //                     obj.maximum_user = keyy.maximum_user;
    //                     obj.status = keyy.status;
    //                     obj.joinedusers = keyy.joinedusers;
    //                     obj.contest_type = keyy.contest_type;
    //                     obj.contest_name = keyy?.contest_name;
    //                     obj.mega_status = keyy.mega_status;
    //                     obj.winning_percentage = keyy.winning_percentage;
    //                     obj.is_bonus = keyy.is_bonus;
    //                     obj.bonus_percentage = keyy.bonus_percentage;
    //                     obj.pricecard_type = keyy.pricecard_type;
    //                     obj.minimum_user = keyy.minimum_user;
    //                     obj.confirmed_challenge = keyy.confirmed_challenge;
    //                     obj.multi_entry = keyy.multi_entry;
    //                     obj.team_limit = keyy.team_limit;
    //                     obj.c_type = keyy.c_type;
    //                     obj.is_private = keyy.is_private;
    //                     obj.is_running = keyy.is_running;
    //                     obj.is_deleted = keyy.is_deleted;
    //                     obj.matchpricecards = keyy.matchpricecards;
    //                     obj.amount_type = keyy.amount_type;
    //                 }


    //                 anArray.push(obj)
    //             }

    //         } else {
    //             getlistofMatches = []
    //         }
    //         // console.log("anArray.................//////////.anArray.............................................", anArray)
    //         if (getLunchedMatch) {
    //             return {
    //                 matchData: anArray,
    //                 matchkey: req.body.matchkey,
    //                 data: getLunchedMatch,
    //                 status: true
    //             }
    //         } else {
    //             return {
    //                 status: false,
    //                 message: 'can not get list-Matches data'
    //             }
    //         }
    //     } catch (error) {
    //         throw error;
    //     }
    // }
    // async importchallengersData(req) {
    //     try {
    //         //sahil redis
    //         let keyname=`listMatchesModel-${req.params.matchkey}`
    //         let redisdata=await Redis.getkeydata(keyname);
    //         let findmatch;
    //         if(redisdata)
    //         {
    //             findmatch=redisdata;
    //         }
    //         else
    //         {
    //             findmatch = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.params.matchKey) });
    //             let redisdata=Redis.setkeydata(keyname,findmatch,60*60*4);
    //         }

    //         //sahil redis end
    //         //comment for redis-->const findmatch = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.params.matchKey) });
    //         console.log("findmatch"+findmatch)
    //         if (findmatch) {
    //             const findleauges = await challengersModel.find({ fantasy_type: { $regex: new RegExp(findmatch.fantasy_type.toLowerCase(), "i") } });
    //              console.log("findleauges....////////....",findleauges)
    //             let anArray = [];
    //             if (findleauges.length > 0) {
    //                 for await (let key1 of findleauges) {
    //                     const findchallengeexist = await matchchallengersModel.find({ matchkey: mongoose.Types.ObjectId(req.params.matchKey), challenge_id: mongoose.Types.ObjectId(key1._id) });
    //                     if (findchallengeexist.length == 0) {
    //                         let data = {};
    //                         data['challenge_id'] = mongoose.Types.ObjectId(key1._id);
    //                         data['contest_cat'] = mongoose.Types.ObjectId(key1.contest_cat);
    //                         data['contest_type'] = key1.contest_type;
    //                         data['winning_percentage'] = key1.winning_percentage;
    //                         data['is_bonus'] = key1.is_bonus;
    //                         data['bonus_percentage'] = key1.bonus_percentage;
    //                         data['pricecard_type'] = key1.pricecard_type;
    //                         data['entryfee'] = key1.entryfee;
    //                         data['win_amount'] = key1.win_amount;
    //                         data['maximum_user'] = key1.maximum_user;
    //                         data['status'] = 'opened';
    //                         data['confirmed_challenge'] = key1.confirmed_challenge;
    //                         data['is_running'] = key1.is_running;
    //                         data['multi_entry'] = key1.multi_entry;
    //                         data['team_limit'] = key1.team_limit;
    //                         data['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
    //                         data['contest_name'] = key1.contest_name;
    //                         data['amount_type'] = key1.amount_type;
    //         //sahil redis
    //         //let keyname=`contest-${req.params.matchkey}`
    //         // let redisdata=await Redis.getkeydata(keyname);
    //         // let saveInsert;
    //         // if(redisdata)
    //         // {
    //         //     getseries=redisdata;
    //         // }
    //         // else
    //         // {
    //             // const insertData = new matchchallengersModel(data);
    //             // saveInsert = await insertData.save();

    //             // let redisdata=Redis.setkeydata(keyname,data,60*60*48);
    //         // }

    //         //sahil redis end
    //                         const insertData = new matchchallengersModel(data);
    //                         let saveInsert = await insertData.save();

    //                         let findpricecrads = await priceCardModel.find({ challengersId: key1._id });
    //                         // console.log("findpricecrads..................priceCard.........///////........", findpricecrads)

    //                         if (findpricecrads.length > 0) {
    //                             for await (let key2 of findpricecrads) {
    //                                 let pdata = {};
    //                                 pdata['challengeId'] = mongoose.Types.ObjectId(key2.challengersId);
    //                                 pdata['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
    //                                 pdata['winners'] = key2.winners;
    //                                 pdata['price'] = key2.price;
    //                                 if (key2.price_percent) {
    //                                     pdata['price_percent'] = key2.price_percent;
    //                                 }
    //                                 if (key1.amount_type == "prize") {
    //                                     pdata['prize_name'] = key2.prize_name;
    //                                     pdata['image'] = key2.image;
    //                                 }
    //                                 pdata["gift_type"] = key2.gift_type || "amount";
    //                                 pdata['min_position'] = key2.min_position;
    //                                 pdata['max_position'] = key2.max_position;
    //                                 pdata['total'] = key2.total;
    //                                 pdata['type'] = key2.type;

    //                                 const updateInsert = await matchchallengersModel.updateOne({ _id: mongoose.Types.ObjectId(saveInsert._id) }, {
    //                                     $push: {
    //                                         matchpricecards: pdata
    //                                     }
    //                                 })
    //                                 // console.log("updateInsert.................", updateInsert)
    //                             }
    //                         }
    //                     }
    //                 }
    //                 return {
    //                     status: true,
    //                     message: 'Challenge imported successfully'
    //                 }

    //             }
    //             return {
    //                 status: false,
    //                 message: 'Challenge not Found ..error..'
    //             }

    //         }
    //         return {
    //             status: false,
    //             message: 'Challenge not imported ..error..'
    //         }
    //     } catch (error) {
    //         throw error;
    //     }
    // }


    async createCustomContest(req) {
        try {
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            let teamData = []
            const getLunchedMatch = await listMatchesModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } }, { fantasy_type: 1, name: 1 });

            let getlistofMatches
            let anArray = [];
            if (req.query.matchkey) {
                let qukey = req.query.matchkey
                let objfind = {};
                objfind.matchkey = mongoose.Types.ObjectId(qukey)
                if (req.query.entryfee && req.query.entryfee != "") {
                    objfind.entryfee = Number(req.query.entryfee)
                }
                if (req.query.win_amount && req.query.win_amount != "") {
                    objfind.win_amount = Number(req.query.win_amount)
                }
                if (req.query.team_limit && req.query.team_limit != "") {
                    objfind.team_limit = Number(req.query.team_limit)
                }
                if (req.query.overNo && req.query.overNo != "") {
                    objfind.overNo = Number(req.query.overNo)
                }
                if (req.query.teamId && req.query.teamId != "") {
                    objfind.teamId = mongoose.Types.ObjectId(req.query.teamId)
                }
                console.log('objfind', objfind);
                if(req.query && req.query.fantasy_type && req.query.fantasy_type== 'overfantasy'){
                    let agg = [
                        {
                          '$match': { matchkey: mongoose.Types.ObjectId(qukey)}
                        }, {
                          '$lookup': {
                            'from': 'matchovers', 
                            'localField': 'overId', 
                            'foreignField': '_id', 
                            'as': 'result'
                          }
                        }, {
                          '$replaceRoot': {
                            'newRoot': {
                              '$mergeObjects': [
                                {
                                  '$arrayElemAt': [
                                    '$result', 0
                                  ]
                                }, '$$ROOT'
                              ]
                            }
                          }
                        },
                        {
                            '$match':objfind
                          }
                      ]
                    //  delete objfind.matchkey

                      
                    getlistofMatches = await overContestModel.aggregate(agg);
                   
                }else{
                    getlistofMatches = await matchchallengersModel.find(objfind);
                }
                // console.log("getlistofMatches.....>",getlistofMatches)
                for await (let keyy of getlistofMatches) {
                    let obj = {};
                    let newDate = moment(keyy.createdAt).format('MMM Do YY');
                    let day = moment(keyy.createdAt).format('dddd');
                    let time = moment(keyy.createdAt).format('h:mm:ss a');
                    if (keyy.is_expert == 1) {
                        obj.newDate = newDate;
                        obj.day = day;
                        obj.time = time;
                        obj.contest_cat = keyy.contest_cat;
                        obj.matchkey = keyy.matchkey;
                        obj.fantasy_type = keyy.fantasy_type
                        obj.entryfee = keyy.entryfee;
                        obj.win_amount = keyy.win_amount;
                        obj.status = keyy.status;
                        obj.contest_type = keyy.contest_type;
                        obj.winning_percentage = keyy.winning_percentage;
                        obj.is_bonus = keyy.is_bonus;
                        obj.bonus_percentage = keyy.bonus_percentage;
                        obj.amount_type = keyy.amount_type;
                        obj.c_type = keyy.c_type;
                        obj.is_private = keyy.is_private;
                        obj.is_running = keyy.is_running;
                        obj.confirmed_challenge = keyy.confirmed_challenge;
                        obj.multi_entry = keyy.multi_entry;
                        obj._id = keyy._id;
                        obj.joinedusers = keyy.joinedusers;
                        obj.team_limit = keyy.team_limit;

                    } else {
                        obj.newDate = newDate;
                        obj.day = day;
                        obj.time = time;
                        obj._id = keyy._id;
                        obj.contest_cat = keyy.contest_cat;
                        obj.challenge_id = keyy.challenge_id;
                        obj.matchkey = keyy.matchkey;
                        obj.fantasy_type = keyy.fantasy_type;
                        obj.entryfee = keyy.entryfee;
                        obj.win_amount = keyy.win_amount;
                        obj.maximum_user = keyy.maximum_user;
                        obj.status = keyy.status;
                        obj.joinedusers = keyy.joinedusers;
                        obj.contest_type = keyy.contest_type;
                        obj.contest_name = keyy?.contest_name;
                        obj.mega_status = keyy.mega_status;
                        obj.winning_percentage = keyy.winning_percentage;
                        obj.is_bonus = keyy.is_bonus;
                        obj.bonus_percentage = keyy.bonus_percentage;
                        obj.pricecard_type = keyy.pricecard_type;
                        obj.minimum_user = keyy.minimum_user;
                        obj.confirmed_challenge = keyy.confirmed_challenge;
                        obj.multi_entry = keyy.multi_entry;
                        obj.team_limit = keyy.team_limit;
                        obj.c_type = keyy.c_type;
                        obj.is_private = keyy.is_private;
                        obj.is_running = keyy.is_running;
                        obj.is_deleted = keyy.is_deleted;
                        obj.matchpricecards = keyy.matchpricecards;
                        obj.amount_type = keyy.amount_type;
                    }

if(req.query && req.query.fantasy_type && req.query.fantasy_type== 'overfantasy'){
    obj.overNo = keyy.overNo;
}
                    anArray.push(obj)
                }
 teamData = await listMatchesModel.aggregate([
    {
      '$match': {
        '_id': mongoose.Types.ObjectId(req.query.matchkey),
        fantasy_type:req.query.fantasy_type
      }
    }, {
      '$lookup': {
        'from': 'teams', 
        'localField': 'team1Id', 
        'foreignField': '_id', 
        'as': 't1'
      }
    }, {
      '$lookup': {
        'from': 'teams', 
        'localField': 'team2Id', 
        'foreignField': '_id', 
        'as': 't2'
      }
    }, {
      '$project': {
        'team': {
          '$concatArrays': [
            '$t1', '$t2'
          ]
        }, 
        '_id': 0
      }
    }
  ])
  
            } else {
                getlistofMatches = []
            }
            // console.log("anArray.................//////////.anArray.............................................", anArray)
            if (getLunchedMatch) {
                return {
                    matchData: anArray,
                    matchkey: req.body.matchkey,
                    data: getLunchedMatch,
                    status: true,
                    fantasy_type:req.query.fantasy_type?req.query.fantasy_type:null,
                    teamData:teamData.length>0?teamData[0].team:[],
                    flag:teamData.length>0?1:0
                }
            } else {
                return {
                    status: false,
                    message: 'can not get list-Matches data'
                }
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async importchallengersData(req) {
        try {
            //sahil redis
            let keyname = `listMatchesModel-${req.params.matchkey}`
            // let redisdata = await Redis.getkeydata(keyname);
            let redisdata = 0


            let findmatch;

            if (redisdata) {
                findmatch = redisdata;
            }
            else {
                findmatch = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.params.matchKey) });
                let redisdata = Redis.setkeydata(keyname, findmatch, 60 * 60 * 4);
            }

            //sahil redis end
            //comment for redis-->const findmatch = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.params.matchKey) });
            console.log("findmatch" + findmatch)
            if (findmatch) {
req.fantasy_type = findmatch.fantasy_type
                if (findmatch.fantasy_type == 'overfantasy') {
                    const matchOverOfTeam1 = await matchOverModel.find({ matchId: mongoose.Types.ObjectId(req.params.matchKey), teamId: mongoose.Types.ObjectId(findmatch.team1Id) })
                    const matchOverOfTeam2 = await matchOverModel.find({ matchId: mongoose.Types.ObjectId(req.params.matchKey), teamId: mongoose.Types.ObjectId(findmatch.team2Id) })


                    const findleauges = await challengersModel.find({ fantasy_type: { $regex: new RegExp(findmatch.fantasy_type.toLowerCase(), "i") } });
                    // console.log("findleauges....////////....", findleauges)
                    if (findleauges.length == 0) {
                        return {
                            status: false,
                            message: 'Challenge not Found ..error..'
                        }
                    }
                    let anArray = [];
                    let flag1 = await this.createOverChallenge(matchOverOfTeam1, findleauges, req)
                    let flag2 = await this.createOverChallenge(matchOverOfTeam2, findleauges, req)


                    if (flag1 && flag2) {
                        return {
                            status: true,
                            message: 'Challenge imported successfully'
                        }
                    }
                } else {
                    const findleauges = await challengersModel.find({ fantasy_type: { $regex: new RegExp(findmatch.fantasy_type.toLowerCase(), "i") } });
                    console.log("findleauges....////////....", findleauges)
                    let anArray = [];
                    if (findleauges.length > 0) {
                        for await (let key1 of findleauges) {
                            const findchallengeexist = await matchchallengersModel.find({ matchkey: mongoose.Types.ObjectId(req.params.matchKey), challenge_id: mongoose.Types.ObjectId(key1._id) });
                            if (findchallengeexist.length == 0) {
                                let data = {};
                                data['challenge_id'] = mongoose.Types.ObjectId(key1._id);
                                data['contest_cat'] = mongoose.Types.ObjectId(key1.contest_cat);
                                data['contest_type'] = key1.contest_type;
                                data['winning_percentage'] = key1.winning_percentage;
                                data['is_bonus'] = key1.is_bonus;
                                data['bonus_percentage'] = key1.bonus_percentage;
                                data['pricecard_type'] = key1.pricecard_type;
                                data['entryfee'] = key1.entryfee;
                                data['win_amount'] = key1.win_amount;
                                data['maximum_user'] = key1.maximum_user;
                                data['status'] = 'opened';
                                data['confirmed_challenge'] = key1.confirmed_challenge;
                                data['is_running'] = key1.is_running;
                                data['multi_entry'] = key1.multi_entry;
                                data['team_limit'] = key1.team_limit;
                                data['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
                                data['contest_name'] = key1.contest_name;
                                data['amount_type'] = key1.amount_type;
                                //sahil redis
                                //let keyname=`contest-${req.params.matchkey}`
                                // let redisdata=await Redis.getkeydata(keyname);
                                // let saveInsert;
                                // if(redisdata)
                                // {
                                //     getseries=redisdata;
                                // }
                                // else
                                // {
                                // const insertData = new matchchallengersModel(data);
                                // saveInsert = await insertData.save();

                                // let redisdata=Redis.setkeydata(keyname,data,60*60*48);
                                // }

                                //sahil redis end
                                const insertData = new matchchallengersModel(data);
                                let saveInsert = await insertData.save();

                                let findpricecrads = await priceCardModel.find({ challengersId: key1._id });
                                // console.log("findpricecrads..................priceCard.........///////........", findpricecrads)

                                if (findpricecrads.length > 0) {
                                    for await (let key2 of findpricecrads) {
                                        let pdata = {};
                                        pdata['challengeId'] = mongoose.Types.ObjectId(key2.challengersId);
                                        pdata['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
                                        pdata['winners'] = key2.winners;
                                        pdata['price'] = key2.price;
                                        if (key2.price_percent) {
                                            pdata['price_percent'] = key2.price_percent;
                                        }
                                        if (key1.amount_type == "prize") {
                                            pdata['prize_name'] = key2.prize_name;
                                            pdata['image'] = key2.image;
                                        }
                                        pdata["gift_type"] = key2.gift_type || "amount";
                                        pdata['min_position'] = key2.min_position;
                                        pdata['max_position'] = key2.max_position;
                                        pdata['total'] = key2.total;
                                        pdata['type'] = key2.type;

                                        const updateInsert = await matchchallengersModel.updateOne({ _id: mongoose.Types.ObjectId(saveInsert._id) }, {
                                            $push: {
                                                matchpricecards: pdata
                                            }
                                        })
                                        // console.log("updateInsert.................", updateInsert)
                                    }
                                }
                            }
                        }
                        return {
                            status: true,
                            message: 'Challenge imported successfully'
                        }
                    }


                    return {
                        status: false,
                        message: 'Challenge not imported ..error.. as No matchFound'
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async createOverChallenge(overs, legue, req) {

        try {
            for (let i = 0; i < overs.length; i++) {

                if (legue.length > 0) {
                    for await (let key1 of legue) {
                        const findchallengeexist = await overContestModel.find({ matchkey: mongoose.Types.ObjectId(req.params.matchKey), challenge_id: mongoose.Types.ObjectId(key1._id), overId: mongoose.Types.ObjectId(overs[i]._id) });
                        if (findchallengeexist.length == 0) {
                            let data = {};
                            data['challenge_id'] = mongoose.Types.ObjectId(key1._id);
                            data['contest_cat'] = mongoose.Types.ObjectId(key1.contest_cat);
                            data['contest_type'] = key1.contest_type;
                            data['winning_percentage'] = key1.winning_percentage;
                            data['is_bonus'] = key1.is_bonus;
                            data['bonus_percentage'] = key1.bonus_percentage;
                            data['pricecard_type'] = key1.pricecard_type;
                            data['entryfee'] = key1.entryfee;
                            data['win_amount'] = key1.win_amount;
                            data['maximum_user'] = key1.maximum_user;
                            data['status'] = 'opened';
                            data['confirmed_challenge'] = key1.confirmed_challenge;
                            data['is_running'] = key1.is_running;
                            data['multi_entry'] = key1.multi_entry;
                            data['team_limit'] = key1.team_limit;
                            data['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
                            data['contest_name'] = key1.contest_name;
                            data['amount_type'] = key1.amount_type;
                            data["overId"] = mongoose.Types.ObjectId(overs[i]._id)
                            data.fantasy_type = key1.fantasy_type

                         
                            const insertData = new overContestModel(data);
                            let saveInsert = await insertData.save();


                            let findpricecrads = await priceCardModel.find({ challengersId: key1._id });
                            // console.log("findpricecrads..................priceCard.........///////........", findpricecrads)

                            if (findpricecrads.length > 0) {
                                for await (let key2 of findpricecrads) {
                                    let pdata = {};
                                    pdata['challengeId'] = mongoose.Types.ObjectId(key2.challengersId);
                                    pdata['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
                                    pdata['winners'] = key2.winners;
                                    pdata['price'] = key2.price;
                                    if (key2.price_percent) {
                                        pdata['price_percent'] = key2.price_percent;
                                    }
                                    if (key1.amount_type == "prize") {
                                        pdata['prize_name'] = key2.prize_name;
                                        pdata['image'] = key2.image;
                                    }
                                    pdata["gift_type"] = key2.gift_type || "amount";
                                    pdata['min_position'] = key2.min_position;
                                    pdata['max_position'] = key2.max_position;
                                    pdata['total'] = key2.total;
                                    pdata['type'] = key2.type;

                                    const updateInsert = await overContestModel.updateOne({ _id: mongoose.Types.ObjectId(saveInsert._id) }, {
                                        $push: {
                                            matchpricecards: pdata
                                        }
                                    })
                                    // console.log("updateInsert.................", updateInsert)
                                }
                            }
                        }
                    }


                }
            }
            return true



        } catch (error) {
            console.log(error);
            throw error
        }

    }

    async add_CustomContest(req) {
        try {
            const getLunchedMatchinAddContest = await listMatchesModel.find({ status: "notstarted", launch_status: "launched", final_status: { $ne: "IsCanceled" } }, { fantasy_type: 1, name: 1 });
            console.log("getLunchedMatchinAddContest", getLunchedMatchinAddContest)
            const getContest = await contestCategoryModel.find({}, { name: 1 });

            if (getLunchedMatchinAddContest) {
                return {
                    data: getLunchedMatchinAddContest,
                    contestData: getContest,
                    status: true
                }
            } else {
                return {
                    status: false,
                    message: 'can not get list-Matches data'
                }
            }
        } catch (error) {
            throw error
        }
    }
    async addCustom_contestData(req) {
        try {
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            if (req.body.entryfee && req.body.win_amount && req.body.contest_type && req.body.contest_cat) {
                // if (Number(req.body.entryfee) == 0 || Number(req.body.win_amount) == 0) {
                //     return {
                //         status: false,
                //         message: 'entryfee or win_amount can not equal to Zero'
                //     }
                // }
                const findAllListmatches = await listMatchesModel.find({ fantasy_type: req.body.fantasy_type, launch_status: 'launched', start_date: curTime }, { name: 1, real_matchkey: 1 });
                let obj = {}
                // const checkListMatch
                if (req.body.maximum_user) {
                    if (req.body.maximum_user < 2 || !req.body.maximum_user) {
                        return {
                            status: false,
                            message: 'Value of maximum user not less than 2...'
                        }
                    }
                }
                if (req.body.winning_percentage) {
                    if (req.body.winning_percentage == 0) {
                        return {
                            status: false,
                            message: 'Value of winning percentage not equal to 0...'
                        }
                    }
                }

                if (req.body.bonus_percentage) {
                    if (req.body.bonus_percentage == 0) {
                        return {
                            status: false,
                            message: 'Value of bonus percentage not equal to 0..'
                        }
                    }
                }
                if (!req.body.maximum_user) {
                    req.body.maximum_user = 0;
                }
                if (!req.body.winning_percentage) {
                    req.body.winning_percentage = 0;
                }
                if (req.body.contest_type == 'Percentage') {
                    req.body.maximum_user = '0';
                    req.body.pricecard_type = '0';
                }
                if (req.body.contest_type == 'Amount') {
                    req.body.winning_percentage = '0';
                }
                if (req.body.multientry_limit) {
                    if (req.body.multientry_limit == 0) {
                        return {
                            status: true,
                            message: 'Value of Team limit not equal to 0...'
                        }
                    } else {
                        obj.multi_entry = 1;
                    }
                }
                if (req.body.team_limit) {
                    if (Number(req.body.team_limit) == 0 || Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)) {
                        return {
                            status: false,
                            message: `Value of Team limit not equal to 0..or more then ${config.TEAM_LIMIT}.`
                        }
                    } else {
                        obj.multi_entry = 1;
                    }
                }
                if (req.body.maximum_user) {
                    obj.maximum_user = req.body.maximum_user;
                }

                if (req.body.created_by) {
                    if (!req.body.created_by) {
                        obj.created_by = req.body.created_by;
                        obj.is_private = 1;
                        obj.is_admin = 1;
                    }
                }
                if (req.body.winning_percentage) {
                    obj.winning_percentage = req.body.winning_percentage;
                }

                if (req.body.confirmed_challenge) {
                    obj.confirmed_challenge = 1;
                } else {
                    if (req.body.contest_type == 'Amount' && req.body.pricecard_type == 'Percentage') {
                        obj.confirmed_challenge = 1;
                    }
                }
                if (req.body.is_running) {
                    obj.is_running = 1;
                }
                if (req.body.is_bonus) {
                    obj.is_bonus = 1;
                    obj.bonus_percentage = req.body.bonus_percentage;
                }
                if (req.body.multi_entry) {
                    obj.multi_entry = 1;
                    obj.multi_entry = req.body.multi_entry;
                    obj.team_limit = req.body.team_limit;
                }
                obj.contest_type = req.body.contest_type;
                obj.pricecard_type = req.body.pricecard_type;
                obj.contest_cat = req.body.contest_cat;
                obj.contest_name = req.body.contest_name;
                obj.entryfee = req.body.entryfee;
                obj.win_amount = req.body.win_amount;
                obj.matchkey = req.body.matchkey;
                obj.status = 'opened';
                obj.fantasy_type = req.body.fantasy_type;
                obj.amount_type = req.body.amount_type;
                //sahil redis
                //let keyname=`contest-${req.body.matchkey}`
                // let redisdata=await Redis.getkeydata(keyname);
                // let saveInsert;
                // if(redisdata)
                // {
                //     getseries=redisdata;
                // }
                // else
                // {
                // const insertMatch = new matchchallengersModel(obj);
                // let saveMatch = await insertMatch.save();
                // let redisdata=Redis.setkeydata(keyname,obj,60*60*48);
                // }

                //sahil redis end

                const insertMatch = new matchchallengersModel(obj);
                let saveMatch = await insertMatch.save();
                // console.log("saveMatch..........", saveMatch)
                if (saveMatch) {
                    return {
                        // matchChallengerId:saveMatch._id,
                        status: true,
                        message: 'Successfully created contest',
                        renderStatus: req.body.contest_type,
                        data: saveMatch,
                    }
                } else {
                    return {
                        status: false,
                        message: 'contest not created ..error..'
                    }
                }
            }




        } catch (error) {
            throw error;
        }
    }
    async addMatchPriceCard_page(req) {
        try {


        } catch (error) {
            throw error
        }
    }
    async editcustomcontest_page(req) {
        try {
           
            const {fantasy_type} =req.query
            let getDatas = fantasy_type == "overfantasy"? await overContestModel.findOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) }).populate("overId") : await matchchallengersModel.findOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) });
            const getLunchedMatchinAddContest = await listMatchesModel.find({ status: "notstarted", launch_status: "launched" }, { fantasy_type: 1, name: 1 });
            const getContest = await contestCategoryModel.find({}, { name: 1 });
            if (getDatas) {
                return {
                    status: true,
                    data: getDatas,
                    launchMatchData: getLunchedMatchinAddContest,
                    contestData: getContest
                }
            } else {
                return {
                    status: false,
                    message: 'match challenge not found..'
                }
            }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async editcustomcontest_data(req) {
        try {

            if (req.body.entryfee && req.body.win_amount && req.body.contest_type && req.body.contest_cat && req.query.fantasy_type) {
                const challengers = req.query.fantasy_type == "overfantasy"? await overContestModel.findOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) }) : await matchchallengersModel.findOne({ _id: req.params.MatchChallengerId });

                if (challengers) {
                    let data = {}
                    if (req.body.team_limit) {
                        if (req.body.team_limit == 0) {
                            return {
                                status: false,
                                message: 'Value of multientry limit not equal to 0...'
                            }
                        } else {
                            data.multi_entry = 1;
                        }
                    }
                    if (req.body.multi_entry) {
                        req.body.multi_entry = 1;
                    } else {
                        req.body.multi_entry = 0;
                    }
                    if (req.body.confirmed_challenge) {
                        req.body.confirmed_challenge = 1;
                    } else {
                        req.body.confirmed_challenge = 0;
                    }
                    if (req.body.is_running) {
                        req.body.is_running = 1;
                    } else {
                        req.body.is_running = 0;
                    }
                    if (req.body.maximum_user) {
                        if (req.body.maximum_user < 2) {
                            return {
                                status: false,
                                message: 'Value of maximum user not less than 2...'
                            }
                        }
                    }
                    if (req.body.winning_percentage) {
                        if (req.body.winning_percentage == 0) {
                            return {
                                status: false,
                                message: 'Value of winning percentage not equal to 0...'
                            }
                        }
                    }
                    if (req.body.bonus_percentage) {
                        if (req.body.bonus_percentage == 0) {
                            return {
                                status: false,
                                message: 'Value of winning percentage not equal to 0...'
                            }
                        }
                    }
                    if (!req.body.bonus_percentage) {
                        req.body.bonus_percentage = 0;
                        req.body.is_bonus = 0;
                    }
                    if (!req.body.maximum_user) {
                        req.body.maximum_user = 0;
                    }
                    if (!req.body.winning_percentage) {
                        req.body.winning_percentage = 0;
                    }
                    const findJoinedLeauges = await JoinLeaugeModel.find({ challengeid: req.params.MatchChallengerId });
                    if (findJoinedLeauges.length > 0) {
                        return {
                            status: false,
                            message: 'You cannot edit this challenge now!'
                        }
                    }
                    if (req.body.contest_type == 'Percentage') {
                        req.body.maximum_user = '0';
                        req.body.pricecard_type = '0';
                        data.matchpricecards = []
                    }
                    if (req.body.contest_type == 'Amount') {
                        req.body.winning_percentage = '0';
                    }
                    req.body.status = 'opened';


                    if (!req.body.pricecard_type) {
                        if (req.body.pricecard_type == 'Amount') {
                            data.matchpricecards = [];
                        } else if (req.body.pricecard_type == 'Percentage') {
                            data.matchpricecards = []
                        }
                    }
                    if (req.body.contest_type == 'Amount') {
                        if (!req.body.pricecard_type) {
                            req.body.pricecard_type = 'Amount';
                        }
                        req.body.winning_percentage = '0';
                    }
                    if (req.body.maximum_user) {
                        data.maximum_user = req.body.maximum_user;
                    }
                    if (req.body.winning_percentage) {
                        data.winning_percentage = req.body.winning_percentage;
                    }
                    if (req.body.confirmed_challenge) {
                        data.confirmed_challenge = 1;
                    } else {
                        data.confirmed_challenge = 0;
                    }
                    if (req.body.is_running) {
                        data.is_running = 1;
                    } else {
                        data.is_running = 0;
                    }
                    if (req.body.is_bonus) {
                        data.is_bonus = 1;
                        data.bonus_percentage = req.body.bonus_percentage;
                    } else {
                        data.is_bonus = 0;
                        data.bonus_percentage = 0;
                    }
                    if (req.body.multi_entry) {
                        data.multi_entry = 1;
                        data.multi_entry = req.body.multi_entry;
                        data.team_limit = req.body.team_limit;
                    } else {
                        data.multi_entry = 0;
                    }
                    if (Number(req.body.win_amount) != Number(challengers.win_amount)) {

                        data.matchpricecards = []
                    }
                    if (Number(req.body.maximum_user) != Number(challengers.maximum_user)) {

                        data.matchpricecards = []
                    }
                    if (req.body.pricecard_type != challengers.pricecard_type) {

                        data.matchpricecards = []
                    }

                    data.contest_type = req.body.contest_type;
                    data.pricecard_type = req.body.pricecard_type;
                    data.contest_cat = req.body.contest_cat;
                    data.entryfee = req.body.entryfee;
                    data.win_amount = req.body.win_amount;
                    data.contest_name = req.body.contest_name;
                    data.amount_type = req.body.amount_type;
                    // req.body.overNo?data.overNo=Number(req.body.overNo):""
                    let rowCollection =  req.query.fantasy_type == "overfantasy"? await overContestModel.findOneAndUpdate({ _id: challengers._id }, {
                        $set: data
                    },{new:true}) : await matchchallengersModel.findOneAndUpdate({ _id: challengers._id }, {
                        $set: data
                    },{new:true});
                    if (rowCollection) {
                        return {
                            status: true,
                            message: 'update successfully',
                            data:rowCollection
                        }
                    } else {
                        return {
                            status: false,
                            message: 'can not update successfully'
                        }
                    }

                } else {
                    return {
                        status: false,
                        message: 'match challenge not found..'
                    }
                }



            }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async delete_customcontest(req) {
        try {
            const deletecustemcontest =req.query.fantasy_type == "overfantasy"? await overContestModel.findOne({ _id: req.params.MatchChallengerId }):  await matchchallengersModel.findOne({ _id: req.params.MatchChallengerId });
            if (deletecustemcontest) {
                const deletecustemcontest =req.query.fantasy_type == "overfantasy"? await overContestModel.deleteOne({ _id: req.params.MatchChallengerId }) : await matchchallengersModel.deleteOne({ _id: req.params.MatchChallengerId });
                if (deletecustemcontest.deletedCount == 1) {
                    return {
                        status: true,
                        message: 'deleted successfully '
                    }
                } else {
                    return {
                        status: false,
                        message: 'contest not delete .. error'
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'Invalid match Provided'
                }
            }

        } catch (error) {
            throw error
        }
    }
    async makeConfirmed(req) {
        try {
           
            const finddata =req.query.fantasy_type == "overfantasy"?  await overContestModel.findOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) }): await matchchallengersModel.findOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) });
            if (finddata) {
            
                const updateConfirmed = req.query.fantasy_type == "overfantasy"? await overContestModel.updateOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) }, {
                    $set: {
                        confirmed_challenge: 1
                    }
                }) : await matchchallengersModel.updateOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) }, {
                    $set: {
                        confirmed_challenge: 1
                    }
                });
              
                if (updateConfirmed.modifiedCount == 1) {
                    return {
                        status: true,
                        message: 'Confirmed challenger'
                    }
                } else {
                    return {
                        status: false,
                        message: 'challenger not Confirmed '
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'invalid challenger'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async addEditmatchpricecard(req) {
        try {
            if (req.params.MatchChallengerId) {
                const challengeData =  req.query.fantasy_type == "overfantasy"? await overContestModel.findOne({ _id: mongoose.Types.ObjectId(req.params.MatchChallengerId) }) : await matchchallengersModel.findOne({ _id: req.params.MatchChallengerId });
                if (challengeData) {
                    const contest_Name = await contestCategoryModel.findById({ _id: challengeData.contest_cat, is_deleted: false }, { name: 1, _id: 0 });
                    if (contest_Name) {
                        let totalAmountForPercentage = 0;
                        if (challengeData.matchpricecards.length == 0) {
                            let position = 0;
                            return {
                                status: true,
                                challengeData,
                                contest_Name,
                                position,
                                totalAmountForPercentage,
                                amount_type: challengeData.amount_type
                            }

                        } else {
                            let lastIndexObject = (challengeData.matchpricecards.length) - 1;
                            let lastObject = challengeData.matchpricecards[lastIndexObject];
                            let position = lastObject.max_position
                            for (let key of challengeData.matchpricecards) {
                                totalAmountForPercentage = totalAmountForPercentage + key.total
                            }
                            return {
                                status: true,
                                challengeData,
                                contest_Name,
                                position,
                                check_PriceCard: challengeData.matchpricecards,
                                totalAmountForPercentage,
                                amount_type: challengeData.amount_type
                            }
                        }

                    } else {
                        return {
                            status: false,
                            message: 'contest not found ..'
                        }
                    }

                } else {
                    return {
                        status: false,
                        message: 'challenge data not found..'
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'Invalid Match challenge Id'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async addEditPriceCard_Post(req) {
        try {
            const challenger_Details = req.query.fantasy_type == "overfantasy"? await overContestModel.findOne({ _id: mongoose.Types.ObjectId(req.body.globelchallengersId) }) :  await matchchallengersModel.findOne({ _id: req.body.globelchallengersId });

            if (Number(req.body.winners) == 0) {
                if (req.body.price) {
                    if (Number(req.body.price) == 0) {
                        return {
                            status: false,
                            message: 'winners or price should not equal to Zero'
                        }
                    }
                }
            }
            if (req.body.typename == "prize" && req.body.gift_type == "gift") {
                req.body.price = 0;
                if (!req.file || !req.body.prize_name) {
                    return {
                        status: false,
                        message: " Please Fill Prize Name && Image  && only jpg..png..jpeg "
                    }
                }
            }
            if (req.body.gift_type == "amount") {
                if (req.body.price <= 0 && !req.body.price) {
                    return {
                        status: false,
                        message: 'price should not zero..'
                    }
                }
            }

            const check_PriceCard = challenger_Details.matchpricecards;
            if (req.body.min_position && req.body.winners) {
                if (check_PriceCard.length == 0) {
                    if (challenger_Details.amount_type == "prize") {
                        if (challenger_Details.win_amount < ((Number(req.body.winners)))) {
                            if (req.file) {
                                let filePath = `public/${req.body.typename}/${req.file.filename}`;
                                if (fs.existsSync(filePath) == true) {
                                    fs.unlinkSync(filePath);
                                }
                            }
                            return {
                                status: false,
                                message: 'price should be less or equal challengers winning amount'
                            }
                        }
                    }
                    if (challenger_Details.win_amount < ((Number(req.body.winners)) * (Number(req.body.price)))) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        return {
                            status: false,
                            message: 'price should be less or equal challengers winning amount'
                        }
                    } else if (challenger_Details.maximum_user < Number(req.body.winners)) {

                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'number of Winner should be less or equal challengers maximum user'
                        }
                    } else {
                        let insertObj = {
                            challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                            winners: Number(req.body.winners),
                            price: Number(req.body.price),
                            min_position: Number(req.body.min_position),
                            max_position: (Math.abs((Number(req.body.min_position)) - (Number(req.body.winners)))),
                            total: ((Number(req.body.winners)) * (Number(req.body.price))),
                            type: 'Amount'
                        }
                        insertObj.gift_type = req.body.gift_type;
                        if (challenger_Details.amount_type == "prize") {
                            insertObj.prize_name = req.body.prize_name;
                            if (req.file) {
                                insertObj.image = `/${req.body.typename}/${req.file.filename}`
                            }

                        }
                        const insertAddEditPriceData = req.query.fantasy_type == "overfantasy"? await overContestModel.updateOne({ _id: req.body.globelchallengersId }, {
                            $push: { matchpricecards: insertObj }
                        }) :   await matchchallengersModel.updateOne({ _id: req.body.globelchallengersId }, {
                            $push: { matchpricecards: insertObj }
                        })
                        // console.log("insertAddEditPriceData", insertAddEditPriceData)
                        if (insertAddEditPriceData.modifiedCount == 1) {
                            return {
                                status: true,
                                message: 'price Card added successfully'
                            };
                        } else {
                            if (req.file) {
                                let filePath = `public/${req.body.typename}/${req.file.filename}`;
                                if (fs.existsSync(filePath) == true) {
                                    fs.unlinkSync(filePath);
                                }
                            }
                            return {
                                status: false,
                                message: 'price Card not added error..'
                            };
                        }

                    }

                } else {
                    let lastIndexObject = (check_PriceCard.length) - 1;
                    let lastObject = check_PriceCard[lastIndexObject];
                    let position = lastObject.max_position;
                    let totalAmountC = 0;
                    for await (let key of check_PriceCard) {
                        totalAmountC = totalAmountC + key.total
                    }
                    if ((totalAmountC + ((Number(req.body.price) * (Number(req.body.winners))))) > challenger_Details.win_amount) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'price should be less or equal to challenge winning Amount'
                        }
                    } else if (challenger_Details.maximum_user < (position + Number(req.body.winners))) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'number of Winner should be less or equal challengers maximum user'
                        }
                    } else {

                        let insertObj = {
                            challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                            winners: Number(req.body.winners),
                            price: Number(req.body.price),
                            min_position: position,
                            max_position: (Number(req.body.min_position)) + (Number(req.body.winners)),
                            total: ((Number(req.body.winners)) * (Number(req.body.price))),
                            type: 'Amount'
                        }
                        insertObj.gift_type = req.body.gift_type;
                        if (challenger_Details.amount_type == "prize") {
                            insertObj.prize_name = req.body.prize_name;
                            if (req.file) {
                                insertObj.image = `/${req.body.typename}/${req.file.filename}`,
                                    insertObj.gift_type = req.body.gift_type;
                            }
                        }
                        const insertAddEditPriceData = req.query.fantasy_type == "overfantasy"? await overContestModel.updateOne({ _id: req.body.globelchallengersId }, {
                            $push: { matchpricecards: insertObj }
                        }) : await matchchallengersModel.updateOne({ _id: req.body.globelchallengersId }, {
                            $push: { matchpricecards: insertObj }
                        });
                        if (insertAddEditPriceData.modifiedCount == 1) {
                            return {
                                status: true,
                                message: 'price Card added successfully'
                            };
                        } else {
                            if (req.file) {
                                let filePath = `public/${req.body.typename}/${req.file.filename}`;
                                if (fs.existsSync(filePath) == true) {
                                    fs.unlinkSync(filePath);
                                }
                            }
                            return {
                                status: false,
                                message: 'price Card not added error..'
                            };
                        }

                    }

                }

            } else {
                return {
                    status: false,
                    message: 'please input the require winners && price..'
                }
            }


        } catch (error) {
            throw error;
        }
    }
    async deleteMatchPriceCard(req) {
        try {
            const challengeData =  req.query.fantasy_type == "overfantasy"? await overContestModel.findOne({ _id: req.query.challengerId }) : await matchchallengersModel.findOne({ _id: req.query.challengerId });
            if (challengeData) {
                let newPriceCard = challengeData.matchpricecards
                let ObjIndex
                newPriceCard.findIndex((i, index) => {
                    if ((i._id).toString() == (req.params.id).toString()) {
                        ObjIndex = index
                    }
                })
                await newPriceCard.splice(ObjIndex, 1);
                const updatePriceCard =  req.query.fantasy_type == "overfantasy"?await overContestModel.updateOne({ _id: req.query.challengerId }, {
                    $set: {
                        matchpricecards: newPriceCard
                    }
                }) : await matchchallengersModel.updateOne({ _id: req.query.challengerId }, {
                    $set: {
                        matchpricecards: newPriceCard
                    }
                })
                if (updatePriceCard.modifiedCount == 1) {
                    return {
                        status: true,
                        message: 'price card delete Successfully'
                    }
                } else {
                    return {
                        status: false,
                        message: 'price card not delete ..error'
                    }
                }


            } else {
                return {
                    status: false,
                    message: 'match challenge not found ..error'
                }
            }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async addEditPriceCardPostbyPercentage(req) {
        try {
            const challenger_Details =  req.query.fantasy_type == "overfantasy"?await overContestModel.findOne({ _id: req.body.globelchallengersId }) : await matchchallengersModel.findOne({ _id: req.body.globelchallengersId });
            let check_PriceCard = challenger_Details.matchpricecards;
            if (Number(req.body.price_percent) == 0 || Number(req.body.winners) == 0) {
                return {
                    status: false,
                    message: 'price percent or winners can not equal to Zero'
                }
            }
            if (challenger_Details) {
                let min_position = req.body.min_position;
                let winners
                let price_percent
                let price
                if (req.body.Percentage) {
                    // console.log(" i am in percentage...........................................///////////////////")
                    if (req.body.user_selection == 'number') {
                        winners = Number(req.body.winners);
                        price_percent = (Number(req.body.price_percent));
                        price = ((challenger_Details.win_amount) * ((Number(req.body.price_percent)) / 100)).toFixed(2);
                        // console.log('.......in Number.EPSILON..........', winners, price_percent, price)
                    } else {
                        winners = ((challenger_Details.maximum_user) * ((Number(req.body.winners)) / 100)).toFixed(2);
                        price_percent = (Number(req.body.price_percent));
                        price = ((challenger_Details.win_amount) * ((Number(req.body.price_percent)) / 100)).toFixed(2);
                        // console.log('.......in percentegae.EPSILON..........', winners, price_percent, price)
                    }
                } else {
                    return {
                        status: false,
                        message: 'is not Percentage'
                    }
                }
                if (min_position && winners && price_percent) {
                    if (winners <= 0) {
                        // console.log("jhbgfhjk.....winner is  ..........zero")
                        return {
                            status: false,
                            message: 'winner should not equal or less then zero'
                        }
                    }
                    // console.log("jgvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv", min_position, winners, price_percent)
                    if (min_position && winners && price_percent) {
                        if (check_PriceCard.length == 0) {
                            if (challenger_Details.win_amount < ((Number(winners)) * (Number(price)))) {
                                return {
                                    status: false,
                                    message: 'price should be less or equal challengers winning amount'
                                }
                            } else if (challenger_Details.maximum_user < Number(winners)) {
                                return {
                                    status: false,
                                    message: 'number of Winner should be less or equal challengers maximum user'
                                }
                            } else {
                                let insertobj = {
                                    challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                                    winners: Number(winners),
                                    price: Number(price),
                                    price_percent: Number(price_percent),
                                    min_position: Number(min_position),
                                    max_position: (Math.abs((Number(min_position)) - (Number(winners)))).toFixed(2),
                                    total: ((Number(winners)) * (Number(price))).toFixed(2),
                                    type: 'Amount'
                                }
                                const insertPriceData =  req.query.fantasy_type == "overfantasy"? await overContestModel.updateOne({ _id: req.body.globelchallengersId }, {
                                    $push: {
                                        matchpricecards: insertobj
                                    }
                                }) : await matchchallengersModel.updateOne({ _id: req.body.globelchallengersId }, {
                                    $push: {
                                        matchpricecards: insertobj
                                    }
                                });

                                if (insertPriceData.modifiedCount == 1) {
                                    return {
                                        status: true,
                                        message: 'price Card added successfully'
                                    };
                                } else {
                                    return {
                                        status: false,
                                        message: 'price Card not add..error..'
                                    };
                                }
                            }


                        } else {

                            let lastIndexObject = (check_PriceCard.length) - 1;
                            // console.log("lastIndexObject.........",lastIndexObject)
                            let lastObject = check_PriceCard[lastIndexObject];
                            // console.log("lastObject........",lastObject);
                            let position = lastObject.max_position

                            let totalAmountC = 0;
                            for (let key of check_PriceCard) {
                                totalAmountC = totalAmountC + key.total
                            }
                            // console.log("totalAmountCt.....", totalAmountC, Number(price), (Number(winners)), challenger_Details.win_amount)
                            // console.log("totalAmountCt.....", (totalAmountC + ((Number(price) * (Number(winners))))) > challenger_Details.win_amount)
                            // console.log(",,,,,,,,,,,,,,,,,,,,,,,,", (challenger_Details.maximum_user < (position + Number(winners))))
                            if ((totalAmountC + ((Number(price) * (Number(winners))))) > challenger_Details.win_amount) {
                                return {
                                    status: false,
                                    message: 'price should be less or equal to challengers winning Amount'
                                }
                            } else if (challenger_Details.maximum_user < (position + Number(winners))) {
                                return {
                                    status: false,
                                    message: 'number of Winner should be less or equal challengers maximum user'
                                }
                            } else {
                                let insertObj = {
                                    challengersId: mongoose.Types.ObjectId(req.body.globelchallengersId),
                                    winners: Number(winners),
                                    price: Number(price),
                                    price_percent: Number(price_percent),
                                    min_position: position,
                                    max_position: (Number(min_position)) + (Number(winners)),
                                    total: (Number(winners)) * (Number(price)),
                                    type: 'Amount'
                                }
                                const insertPriceData = req.query.fantasy_type == "overfantasy"?await overContestModel.updateOne({ _id: req.body.globelchallengersId }, {
                                    $push: {
                                        matchpricecards: insertObj
                                    }
                                }): await matchchallengersModel.updateOne({ _id: req.body.globelchallengersId }, {
                                    $push: {
                                        matchpricecards: insertObj
                                    }
                                })
                                if (insertPriceData.modifiedCount == 1) {
                                    return {
                                        status: true,
                                        message: 'price Card added successfully'
                                    };
                                } else {
                                    return {
                                        status: false,
                                        message: 'price Card not add..error..'
                                    };
                                }
                            }

                        }

                    }
                } else {
                    // console.log("i am here last end")
                    return {
                        status: false,
                        message: 'please enter proper values'
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'match challenge not found..'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async viewAllExportsContests(req) {
        try {
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            // console.log("curTime.........",curTime)
            // start_date: { $gt: curTime }
            const getLunchedMatch = await listMatchesModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } }, { fantasy_type: 1, name: 1 });
            // console.log("--------------------------------getLunchedMatch----------------------",getLunchedMatch);
            let getlistofMatches
            let anArray = [];
            if (req.query.matchkey) {
                let qukey = req.query.matchkey
                // console.log("req.query.matchkey.................................", qukey)
                getlistofMatches = await matchchallengersModel.find({ matchkey: mongoose.Types.ObjectId(qukey), is_expert: 1 });
                // console.log("getlistofMatches.................................",getlistofMatches)
                for await (let keyy of getlistofMatches) {
                    let obj = {};
                    let newDate = moment(keyy.createdAt).format('MMM Do YY');
                    let day = moment(keyy.createdAt).format('dddd');
                    let time = moment(keyy.createdAt).format('h:mm:ss a');

                    obj.newDate = newDate;
                    obj.day = day;
                    obj.time = time;
                    obj._id = keyy._id;
                    obj.contest_cat = keyy.contest_cat;
                    obj.status = keyy.status;
                    obj.expert_name = keyy.expert_name;
                    obj.matchkey = keyy.matchkey;
                    obj.fantasy_type = keyy.fantasy_type;
                    obj.entryfee = keyy.entryfee;
                    obj.multiple_entryfee = keyy.multiple_entryfee;
                    obj.win_amount = keyy.win_amount;
                    obj.confirmed_challenge = keyy.confirmed_challenge;
                    obj.multi_entry = keyy.multi_entry;
                    obj.is_running = keyy.is_running;
                    obj.is_deleted = keyy.is_deleted;
                    obj.amount_type = keyy.amount_type;

                    anArray.push(obj)
                }

            } else {
                getlistofMatches = []
            }
            // console.log("anArray.................//////////.anArray.................", anArray)
            if (getLunchedMatch) {
                return {
                    matchData: anArray,
                    matchkey: req.body.matchkey,
                    data: getLunchedMatch,
                    status: true
                }
            } else {
                return {
                    status: false,
                    message: 'can not get list-Matches data'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async addExpertContestPage(req) {
        try {
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            const getLunchedMatchinAddContest = await listMatchesModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } }, { fantasy_type: 1, name: 1, team1Id: 1, team2Id: 1 });
            // console.log("req.query.matchkey...........",req.query.matchkey)
            let data
            if (req.query.matchkey) {
                data = await listMatchesModel.aggregate([
                    {
                        $match: { _id: mongoose.Types.ObjectId(req.query.matchkey) }
                    },
                    {
                        $lookup: {
                            from: "teams",
                            localField: "team1Id",
                            foreignField: "_id",
                            as: "team1Name"
                        }
                    },
                    {
                        $lookup: {
                            from: "teams",
                            localField: "team2Id",
                            foreignField: "_id",
                            as: "team2Name"
                        }
                    },
                    {
                        $lookup: {
                            from: "players",
                            localField: "team1Id",
                            foreignField: "team",
                            as: "team1player"
                        }
                    },
                    {
                        $lookup: {
                            from: "players",
                            localField: "team2Id",
                            foreignField: "team",
                            as: "team2player"
                        }
                    },
                    {
                        $unwind: {
                            path: "$team2Name",
                        }
                    },
                    {
                        $unwind: {
                            path: "$team1Name",
                        }
                    }]);
            }
            const getContest = await contestCategoryModel.find({}, { name: 1 });
            if (getLunchedMatchinAddContest) {
                if (req.query.matchkey) {
                    return {
                        Matchdata: getLunchedMatchinAddContest,
                        contest_CatData: getContest,
                        matckeyData: data,
                        status: true
                    }
                } else {
                    return {
                        Matchdata: getLunchedMatchinAddContest,
                        contest_CatData: getContest,
                        status: true
                    }
                }

            } else {
                return {
                    status: false,
                    message: 'can not get list-Matches data'
                }
            }

        } catch (error) {
            console.log(error)
        }
    }
    async getTeamNameContestExports(req) {
        try {//sahil redis
            let keyname = `listMatchesModel-${req.query.matchkey}`
            let redisdata = await Redis.getkeydata(keyname);
            let data;
            if (redisdata) {
                data = redisdata;
            }
            else {
                data = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.query.matchkey) });
                let redisdata = Redis.setkeydata(keyname, data, 60 * 60 * 4);
            }

            //sahil redis end
            //commnet for redis-->const data = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.query.matchkey) });
            const getteam1 = await teamModel.findOne({ _id: mongoose.Types.ObjectId(data.team1Id) });
            const getteam2 = await teamModel.findOne({ _id: mongoose.Types.ObjectId(data.team2Id) });
            return {
                team1: getteam2.teamName,
                team2: getteam2.teamName
            }

        } catch (error) {
            console.log(error)
        }
    }
    async contestCancel(req) {
        try {
            const getMatchContestData = req.query.fantasy_type == "overfantasy"?await overContestModel.findOne({ _id: req.params.MatchChallengerId, matchkey: req.query.matchkey }) : await matchchallengersModel.findOne({ _id: req.params.MatchChallengerId, matchkey: req.query.matchkey });

            if (getMatchContestData) {
                let joinLeagues = await JoinLeaugeModel.find({ matchkey: getMatchContestData.matchkey, challengeid: getMatchContestData._id });
                console.log("--joinLeagues--", joinLeagues)
                if (joinLeagues.length > 0) {
                    for (let league of joinLeagues) {
                        let leaugestransaction = league.leaugestransaction;
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                        console.log("--refund_data--", refund_data)
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
                                console.log("--profmiss---", profmiss)
                            }
                        }
                    }
                }
                const getMatchContestData1 =req.query.fantasy_type == "overfantasy"? await overContestModel.updateOne({ _id: req.params.MatchChallengerId }, {
                    $set: {
                        status: config.MATCH_CHALLENGE_STATUS.CANCELED
                    }
                }): await matchchallengersModel.updateOne({ _id: req.params.MatchChallengerId }, {
                    $set: {
                        status: config.MATCH_CHALLENGE_STATUS.CANCELED
                    }
                });
                return {
                    status: true,
                    message: 'custom contest canceled'
                };

            } else {
                return {
                    status: false,
                    message: 'custom constest not found ..error'
                }
            }

        } catch (error) {
            console.log(error)
        }
    }

    async addExpertContestData(req) {
        try {
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }

            }
            // console.log("req...............add expert contest.........................body.................................",req.body);
            if (req.body.matchkey && req.body.contest_cat && req.body.expert_name && req.body.entryfee && req.body.multiple_entryfee && req.body.win_amount) {
                let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
                // start_date:{$gte:curTime}
                const findAllListmatch = await listMatchesModel.find({ launch_status: 'launched', fantasy_type: 'Cricket' }).sort({ start_date: -1 });
                if (findAllListmatch.length > 0) {
                    let data = {};
                    data.matchkey = req.body.matchkey
                    data.contest_cat = req.body.contest_cat;
                    data.expert_name = req.body.expert_name;
                    if (req.file) {
                        data.image = `/${req.body.typename}/${req.file.filename}`
                    }
                    data.entryfee = req.body.entryfee;
                    data.multiple_entryfee = req.body.multiple_entryfee;
                    data.win_amount = req.body.win_amount;
                    data['status'] = 'opened';
                    data['is_expert'] = 1;
                    data['contest_type'] = 'Percentage';
                    data['confirmed_challenge'] = 1;
                    data['winning_percentage'] = 100;
                    data['team1players'] = req.body.team1players;
                    data['team2players'] = req.body.team2players;

                    let is_already = await matchchallengersModel.find({ matchkey: req.body.matchkey, expert_name: req.body.expert_name, entryfee: req.body.entryfee, multiple_entryfee: req.body.multiple_entryfee, win_amount: req.body.win_amount });
                    if (is_already.length > 0) {
                        return {
                            status: false,
                            message: 'expert contest already exist..'
                        }
                    }
                    let allPlayer = [...req.body.team1players, ...req.body.team2players];

                    if (allPlayer.length < 11) {
                        return {
                            status: false,
                            message: "player length must be 11"
                        }
                    }
                    let allcreadits = 0
                    for await (let key of allPlayer) {
                        let findAllPlayerDetails = await playerModel.findOne({ _id: mongoose.Types.ObjectId(key) });

                        if (findAllPlayerDetails) {
                            allcreadits += findAllPlayerDetails.credit
                        }
                    }
                    if (Number(allcreadits) > 100) {
                        return {
                            status: false,
                            message: 'Credit exceeded'
                        }
                    }

                    const insertMatchchallenge = new matchchallengersModel(data);
                    const saveMatchChallenge = await insertMatchchallenge.save();

                    let doc = {};
                    doc['userid'] = null;
                    doc['matchkey'] = req.body.matchkey;
                    doc['teamnumber'] = 1;
                    doc['players'] = allPlayer;
                    doc.vicecaptain = req.body.vicecaptain;
                    doc.captain = req.body.captain;

                    let expert_teamData = new JoinTeamModel(doc);
                    console.log("------expert_teamData----------", expert_teamData)
                    let save_expert_teamData = await expert_teamData.save();


                    let dcc = {};
                    dcc['expert_teamid'] = save_expert_teamData._id;

                    const updateMatchChallenge = await matchchallengersModel.findOneAndUpdate({ _id: insertMatchchallenge._id }, {
                        $set: dcc
                    }, { new: true });

                    return {
                        status: true,
                        message: "Expert Contest Successfully Add....."
                    }
                } else {
                    return {
                        status: false,
                        message: 'listmatch not found...'
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'please add required field matchkey & contest_cat & expert_name & entryfee & multiple_entryfee & win_amount'
                }
            }



            // const checkExpertName=await exportsContestModel.find({expert_name:req.body.expert_name});
            // if(checkExpertName.length > 0){
            //     return{
            //         status:false,
            //         message:'expert name already exist'
            //     }
            // }
            // let doc={};
            // doc.fantasy_type=req.body.fantasy_type;
            // doc.matchkey=req.body.matchkey;
            // doc.contest_cat=req.body.contest_cat;
            // doc.expert_name=req.body.expert_name;
            // doc.entryfee=req.body.entryfee;
            // doc.multiple_entryfee=req.body.multiple_entryfee;
            // doc.win_amount=req.body.win_amount;
            // doc.team1players=req.body.team1players;
            // doc.vicecaptain=req.body.vicecaptain;
            // doc.captain=req.body.captain;
            // doc.team2players=req.body.team2players;
            // doc.image=`/${req.body.typename}/${req.file.filename}`
            // const inertData=new exportsContestModel(doc);
            // const savedata=await inertData.save();
            // if(savedata){
            //     return{
            //         status:true,
            //         message:'expert contest add successfully'
            //     }
            // }else{
            //     return{
            //         status:false,
            //         message:'expert contest not add ..something wrong'
            //     }
            // }

        } catch (error) {
            console.log(error);
        }
    }
    async editExpertContest(req) {
        try {

            let realData = await matchchallengersModel.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });

            let expert_teamid = '';
            if (realData.expert_teamid) {
                expert_teamid = realData.expert_teamid;
            }
            let expert_team = await JoinTeamModel.findOne({ _id: expert_teamid });
            if (expert_team) {
                realData.expert_team = expert_team
            }
            let captain = expert_team.captain;
            let vicecaptain = expert_team.vicecaptain;
            let matckeyData = await listMatchesModel.aggregate([
                {
                    $match: { _id: mongoose.Types.ObjectId(req.query.matchkey) }
                },
                {
                    $lookup: {
                        from: "teams",
                        localField: "team1Id",
                        foreignField: "_id",
                        as: "team1Name"
                    }
                },
                {
                    $lookup: {
                        from: "teams",
                        localField: "team2Id",
                        foreignField: "_id",
                        as: "team2Name"
                    }
                },
                {
                    $lookup: {
                        from: "players",
                        localField: "team1Id",
                        foreignField: "team",
                        as: "team1player"
                    }
                },
                {
                    $lookup: {
                        from: "players",
                        localField: "team2Id",
                        foreignField: "team",
                        as: "team2player"
                    }
                },
                {
                    $unwind: {
                        path: "$team2Name",
                    }
                },
                {
                    $unwind: {
                        path: "$team1Name",
                    }
                }]);

            // console.log("...........matckeyData[0].team1player..............",matckeyData[0].team1player);
            let batsman1 = 0
            let batsman2 = 0
            let bowlers1 = 0
            let bowlers2 = 0
            let allrounder1 = 0
            let allrounder2 = 0
            let wk1 = 0
            let wk2 = 0
            let criteria = 0
            // console.log("matckeyData[0].team1player.length....//.........",realData. team1players.length)
            for await (let key of realData.team1players) {
                // console.log("key.........",key)
                let getRole = await matchPlayerModel.findOne({ playerid: key }, { credit: 1, role: 1 });
                // console.log("getRole.....",getRole.role)
                if (getRole.role == 'batsman') {
                    batsman1++;
                }
                if (getRole.role == 'bowler') {
                    bowlers1++;
                }
                if (getRole.role == 'keeper') {
                    wk1++;
                }
                if (getRole.role == 'allrounder') {
                    allrounder1++
                }
                criteria += getRole.credit
            }
            for await (let key of realData.team2players) {
                let getRole = await matchPlayerModel.findOne({ playerid: key }, { credit: 1, role: 1 });
                if (getRole.role == 'batsman') {
                    batsman2++;
                }
                if (getRole.role == 'bowler') {
                    bowlers2++;
                }
                if (getRole.role == 'keeper') {
                    wk2++;
                }
                if (getRole.role == 'allrounder') {
                    allrounder2++
                }
                criteria += getRole.credit
            }

            // let realData=await exportsContestModel.findOne({_id:mongoose.Types.ObjectId(req.params.id),matchkey:mongoose.Types.ObjectId(req.query.matchkey)});
            const getContest = await contestCategoryModel.find({}, { name: 1 });

            return {
                status: true,
                realData: realData,
                matckeyData: matckeyData,
                contest_CatData: getContest,
                batsman1: batsman1,
                batsman2: batsman2,
                bowlers1: bowlers1,
                bowlers2: bowlers2,
                allrounder1: allrounder1,
                allrounder2: allrounder2,
                wk2: wk2,
                wk1: wk1,
                criteria: criteria,
                vicecaptain: vicecaptain,
                captain: captain
            }
        } catch (error) {
            console.log(error)
        }
    }
    async editExpertContestData(req) {
        try {
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }

            }
            const matchchallenge = await matchchallengersModel.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });
            const findjoinedleauges = await JoinLeaugeModel.findOne({ challengeid: mongoose.Types.ObjectId(req.params.id) });
            if (findjoinedleauges) {
                return {
                    status: false,
                    message: 'You cannot edit this challenge now!'
                }
            }
            let is_already_exists = await matchchallengersModel.find({
                _id: { $ne: mongoose.Types.ObjectId(req.params.id) },
                matchkey: req.body.matchkey,
                expert_name: req.body.expert_name,
                entryfee: req.body.entryfee,
                multiple_entryfee: req.body.multiple_entryfee,
                win_amount: req.body.win_amount
            })
            if (is_already_exists.length > 0) {
                return {
                    status: false,
                    message: 'An expert contest with these details already exists '
                }
            }
            let data = {};
            data.matchkey = req.body.matchkey;
            data.contest_cat = req.body.contest_cat;
            data.expert_name = req.body.expert_name;
            if (req.file) {
                let filePath = `public${matchchallenge.image}`
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                data.image = `/${req.body.typename}/${req.file.filename}`
            }
            data['entryfee'] = req.body.entryfee;
            data['multiple_entryfee'] = req.body.multiple_entryfee;
            data['win_amount'] = req.body.win_amount;
            data['status'] = 'opened';
            data['is_expert'] = 1;
            data['contest_type'] = 'Percentage';
            data['confirmed_challenge'] = 1;
            data['winning_percentage'] = 100;
            data['team1players'] = req.body.team1players;
            data['team2players'] = req.body.team2players;

            let allPlayer = [...req.body.team1players, ...req.body.team2players];
            if (allPlayer.length < 11) {
                return {
                    status: false,
                    message: `player length is ${allPlayer.length} ,must be 11`
                }
            }
            let allcreadits = 0
            let newPlayer = []
            for await (let key of allPlayer) {

                let findAllPlayerDetails = await matchPlayerModel.findOne({ _id: mongoose.Types.ObjectId(key) });
                if (findAllPlayerDetails) {
                    allcreadits += findAllPlayerDetails.credit
                }

            }
            if (Number(allcreadits) > 100) {
                return {
                    status: false,
                    message: `Credit exceeded ${allcreadits}`
                }
            }
            const updateExpertContest = await matchchallengersModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.id) }, data);

            for (let key of allPlayer) newPlayer.push(mongoose.Types.ObjectId(key))

            let doc = {};
            doc['userid'] = null;
            doc['matchkey'] = req.body.matchkey;
            doc['teamnumber'] = 1;
            doc['players'] = newPlayer;
            doc.vicecaptain = req.body.vicecaptain;
            doc.captain = req.body.captain;

            const updateJoinTeam = await JoinTeamModel.findOneAndUpdate({ _id: matchchallenge.expert_teamid }, doc, { new: true });

            return {
                status: true,
                message: "Expert Contest Successfully Update....."
            }


            // --------------------------------------old----------------------------------------
            // let challenge = await matchchallengersModel.findOne({_id:mongoose.Types.ObjectId(req.params.id)})
            // if(challenge){
            //     let findjoinedleauges =await JoinLeaugeModel.find({challengeid:mongoose.Types.ObjectId(challenge._id)});
            //     if(findjoinedleauges.length == 0){
            //         return{
            //             status:false,
            //             message:'You cannot edit this challenge now!'
            //         }
            //     }
            //     data['matchkey'] = req.body.matchkey
            //     data['contest_cat'] = req.body.contest_cat;
            //     data['expert_name'] = req.body.expert_name;
            //     data['entryfee'] = req.body.entryfee;
            //     data['multiple_entryfee'] =req.body.multiple_entryfee;
            //     data['win_amount'] = req.body.win_amount;
            //     data['status'] = 'opened';
            //     data['is_expert'] = 1;
            //     data['contest_type'] = 'Percentage';
            //     data['confirmed_challenge'] = 1;
            //     data['winning_percentage'] = 100;

            //     let is_already=await matchchallengersModel.find({_id:{$ne:mongoose.Types.ObjectId(req.params.id)},matchkey:req.body.matchkey,expert_name:req.body.expert_name,entryfee:req.body.entryfee,win_amount:req.body.win_amount,multiple_entryfee:req.body.multiple_entryfee});
            //     if(is_already){
            //         return{
            //             status:false,
            //             message:'contest expert already exists with same credentials'
            //         }
            //     }

            //     const updateMatchData=await matchchallengersModel.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.params.id)},data);


            //     let allPlayer=[...req.body.team1players,...req.body.team2players];
            //     // console.log("allPlayer..............",allPlayer);
            //     if(allPlayer.length < 11){
            //         return{
            //             status:false,
            //             message:"player leangth must be 11"
            //         }
            //     }
            //     let allcreadits=0
            //     for await(let key of allPlayer){
            //       let findAllPlayerDetails=await matchPlayerModel.findOne({_id:mongoose.Types.ObjectId(key)});
            //       if(findAllPlayerDetails){
            //         allcreadits+=findAllPlayerDetails.credit
            //       }
            //     }
            //     if(Number(allcreadits) > 100){
            //         return{
            //             status:false,
            //             message:'Credit exceeded'
            //         }
            //     }


            //     let data = {};
            //     data['userid'] = null;
            //     data['matchkey'] =req.body.matchkey;
            //     data['teamnumber'] = 1;
            //     data['players'] = allPlayer;
            //     data['captain'] = req.body.captain;
            //     data['vicecaptain'] = req.body.vicecaptain;

            //     let expert_teamData=new JoinTeamModel(doc);
            //     let save_expert_teamData=await expert_teamData.save();


            //     let dcc={};
            //     dcc['expert_teamid'] = save_expert_teamData._id;

            //     const updateMatchChallenge=await matchchallengersModel.findOneAndUpdate({_id:insertMatchchallenge._id},{
            //         $set:dcc
            //     },{new:true});

            //     return{
            //         status:true,
            //         message:"Expert Contest Successfully Update....."
            //     }

            //  }else{
            //     return{
            //         status:false,
            //         message:'match not found something wrong....'
            //     }
            //   }

        } catch (error) {
            console.log(error)
        }
    }
    async joinedBotUser(req) {
        try {
            const _checkMax = await matchchallengersModel.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, { maximum_user: 1 });
            if (_checkMax.maximum_user >= req.body.bot_user_number && 0 < req.body.bot_user_number) {
                let mybotuser = await joinBoatUserService.joinBotUser(req);
                if (mybotuser.status) {
                    return {
                        status: mybotuser.status,
                        message: mybotuser.message
                    }
                }
                return {
                    status: false,
                    message: "Something is Wrong.."
                }
            } else {
                return {
                    status: false,
                    message: `bot user ${req.body.bot_user_number} must be less then or equal to maximum user ${_checkMax.maximum_user}`
                }
            }

        } catch (error) {
            throw error;
        }
    }
}
module.exports = new challengersService();