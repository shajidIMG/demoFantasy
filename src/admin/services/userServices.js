const mongoose = require('mongoose');
const userModel = require('../../models/userModel');
const transactionModel = require('../../models/transactionModel');
const adminWalletModel = require("../../models/adminWalletModel");
const adminModel = require('../../models/adminModel');
const constant = require('../../config/const_credential');
const fs = require("fs");

class UserServices {
    constructor() {
        return {
            viewtransactions: this.viewtransactions.bind(this),
            blockUser: this.blockUser.bind(this),
            unBlockUser: this.unBlockUser.bind(this),
            editUserDetails_page: this.editUserDetails_page.bind(this),
            edituserdetails: this.edituserdetails.bind(this),
            adminwallet: this.adminwallet.bind(this),
            getUserDetails: this.getUserDetails.bind(this),
            addmoneyinwallet: this.addmoneyinwallet.bind(this),
            downloadalluserdetails: this.downloadalluserdetails.bind(this),
            changeYotuberStatus: this.changeYotuberStatus.bind(this),
        }
    }

    async viewtransactions(req) {
        try {
            const findTransactions = await transactionModel.findOne({ userid: req.params.id });
            if (findTransactions) {
                return {
                    status: true,
                    data: findTransactions,
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async editUserDetails_page(req) {
        try {
            const findData = await userModel.findOne({ _id: req.params.id });
            const findAllData = await userModel.find({});
            if (!findData) {
                return {
                    status: false,
                }
            } else {
                return {
                    status: true,
                    data: findData,
                    findAllData: findAllData
                }
            }
        } catch (error) {
            throw error;
        }

    }

    async edituserdetails(req) {
        try {//console.log("req.file.filename"+req.file.filename)
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }

            } else {
                let dataObj = req.body;
                console.log("req.body", req.body)
                const refer_code = await userModel.find({ _id: { $ne: dataObj.Uid }, refer_code: req.body.refer_code });
                //console.log("refer_code", refer_code)
                if (refer_code.length > 0) {
                    let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
                    if (fs.existsSync(filePath) == true) {
                        fs.unlinkSync(filePath);
                    }
                    return {
                        status: false,
                        message: `refercode already exists `
                    }

                }

                const data = await userModel.find({ _id: dataObj.Uid });
                const checkTeam = await userModel.find({ _id: { $ne: dataObj.Uid }, team: req.body.team });
                if (checkTeam.length > 0) {
                    let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
                    if (fs.existsSync(filePath) == true) {
                        fs.unlinkSync(filePath);
                    }
                    return {
                        status: false,
                        message: `team name already exists..`
                    }
                } else {

                    const checkEmail = await userModel.find({ _id: { $ne: dataObj.Uid }, email: req.body.email });
                    if (checkEmail.length > 0) {
                        let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
                        if (fs.existsSync(filePath) == true) {
                            fs.unlinkSync(filePath);
                        }
                        return {
                            status: false,
                            message: 'Email id already register..'
                        }
                    } else {
                        const checkMobile = await userModel.find({ _id: { $ne: dataObj.Uid }, mobile: req.body.mobile });
                        if (checkMobile.length > 0) {
                            let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                            return {
                                status: false,
                                message: 'mobile number already register..'
                            }
                        } else {
                            if (dataObj["pancard.pan_number"]) {
                                if (req.file) {
                                    if (data[0].image) {
                                        let filePath = `public/${data[0].image}`;
                                        if (fs.existsSync(filePath) == true) {
                                            fs.unlinkSync(filePath);
                                        };
                                    };
                                    dataObj["pancard.image"] = `${process.env.BASE_URL}${req.body?.typename}/${req.file?.filename}`;
                                };
                            } else if (dataObj["bank.accno"]) {
                                if (req.file) {
                                    if (data[0].image) {
                                        let filePath = `public/${data[0].image}`;
                                        if (fs.existsSync(filePath) == true) {
                                            fs.unlinkSync(filePath);
                                        };
                                    };
                                    dataObj["bank.image"] = `${process.env.BASE_URL}${req.body?.typename}/${req.file?.filename}`;
                                };
                            } else if (req.file) {
                                if (data[0].image) {
                                    let filePath = `public/${data[0].image}`;
                                    if (fs.existsSync(filePath) == true) {
                                        fs.unlinkSync(filePath);
                                    };
                                };
                                dataObj.image = `${process.env.BASE_URL}${req.body?.typename}/${req.file?.filename}`;
                            };
                            console.log(':::::::::::', dataObj)
                            let updatedUser = await userModel.updateOne({ _id: dataObj.Uid }, { $set: dataObj });
                            console.log("referid",req.body.refer_id)
                            let updatedrefer = await userModel.findByIdAndUpdate({ _id: req.body.refer_id },{$inc: {totalrefercount:1}});

                            //console.log("dataobj", dataObj)
                            if (updatedUser.modifiedCount > 0) {
                                return {
                                    status: true,
                                    message: 'successfully update details'
                                }
                            } else {
                                let filePath = `https://admin.CricketEmpire.com/${req.body?.typename}/${req.file?.filename}`;
                                if (fs.existsSync(filePath) == true) {
                                    fs.unlinkSync(filePath);
                                }
                                return {
                                    status: false,
                                    message: 'something went wrong !!!'
                                }
                            }

                        }

                    }

                }
            }
        } catch (error) {
            throw error;
        }
    }




    async blockUser(req) {
        try {
            const blockUserStatus = await userModel.findOneAndUpdate({ _id: req.params.id }, { $set: { status: 'blocked', auth_key: "" } }, { new: true });

            if (blockUserStatus.status == 'blocked') {
                return {
                    status: true,
                    data: blockUserStatus,
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async unBlockUser(req) {
        try {
            const unBlockUserStatus = await userModel.findOneAndUpdate({ _id: req.params.id }, { $set: { status: 'activated' } }, { new: true });
            if (unBlockUserStatus.status == 'activated') {
                return {
                    status: true,
                    data: unBlockUserStatus,
                }
            }
        } catch (error) {
            throw error;
        }
    }



    async getUserDetails(req) {
        try {
            const findData = await userModel.findOne({ _id: req.params.id });

            if (findData) {
                return {
                    status: true,
                    data: findData,
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async adminwallet(req) {
        try {
            let conditions = {};
            const { name, mobile, email } = req.query;
            if (name) {
                conditions.username = { $regex: name };
            }

            if (mobile) {
                conditions.mobile = Number(mobile);
            }


            if (email) {
                conditions.email = { $regex: email };
            }

            let userFind = await userModel.findOne(conditions);
            if (userFind) {
                return {
                    status: true,
                    data: userFind,
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async addmoneyinwallet(req) {
        try {
            const formData = req.body;
            let getAmount = Number(formData.amount);
            const mPassword = formData.master;
            const uID = formData.userid;
            let customMessage;
            const comparePassword = await adminModel.findOne({ masterpassword: mPassword });
            if (comparePassword) {

                let transactionsObj = {};
                let adminObject = {};
                const transactionOfUser = await userModel.findOne({ _id: uID });
                let creditOfUser = transactionOfUser.userbalance.balance;
                let winningOfUser = transactionOfUser.userbalance.winning;
                let bonusOfUser = transactionOfUser.userbalance.bonus;
                if (formData.bonustype == constant.ADMIN_WALLET_TYPE['ADD_FUND']) {
                    creditOfUser += getAmount;
                    transactionsObj.addfund_amt = getAmount;
                    transactionsObj.type = 'Add Fund Adjustments';
                    adminObject.bonustype = 'add_fund';
                    customMessage = `fund amount added successfully to ${transactionOfUser.username}`;
                }
                if (formData.bonustype == constant.ADMIN_WALLET_TYPE['WINNING']) {
                    winningOfUser += getAmount;
                    transactionsObj.win_amt = getAmount;
                    transactionsObj.type = 'Winning Adjustment';
                    adminObject.bonustype = 'winning';
                    customMessage = `winning amount added successfully to ${transactionOfUser.username}`;

                }
                if (formData.bonustype == constant.ADMIN_WALLET_TYPE['BONUS']) {
                    bonusOfUser += getAmount;
                    transactionsObj.bonus_amt = getAmount;
                    transactionsObj.type = 'Bonus Adjustments';
                    adminObject.bonustype = 'bonus';
                    customMessage = `bonus amount added successfully to ${transactionOfUser.username}`;

                }
                let finalBalance = creditOfUser + winningOfUser + bonusOfUser;
                const updateUserBalance = await userModel.updateOne({ _id: uID }, { $set: { 'userbalance.balance': creditOfUser, 'userbalance.winning': winningOfUser, 'userbalance.bonus': bonusOfUser } });
                transactionsObj.userid = uID;
                transactionsObj.amount = formData.amount;
                transactionsObj.total_available_amt = finalBalance;
                transactionsObj.transaction_by = `${constant.APP_SHORT_NAME}`;
                transactionsObj.transaction_id = `${constant.APP_SHORT_NAME}-EBONUS-${Date.now()}`;
                transactionsObj.bal_bonus_amt = bonusOfUser;
                transactionsObj.bal_win_amt = winningOfUser;
                transactionsObj.bal_fund_amt = creditOfUser;
                transactionsObj.paymentstatus = 'confirmed';
                adminObject.moneytype = 'add_money';
                adminObject.amount = formData.amount;
                adminObject.userid = formData.userid;
                adminObject.description = formData.description;
                const adminData = new adminWalletModel(adminObject);
                const adminDataInsert = await adminData.save();
                const data = new transactionModel(transactionsObj);
                const transitionDataInsert = await data.save();
                return {
                    status: true,
                    data: 'successfully update'
                }
            }
            else {
                return {
                    status: false,
                    data: 'Please insert correct password ⚠️',
                }
            }
        } catch (error) {
            throw error;
        }
    }
    async downloadalluserdetails(req) {
        try {
            let conditions = { userid: req.params.id }
            if (req.query.start_date) {
                conditions.createdAt = { $gte: new Date(req.query.start_date) }
            }
            if (req.query.end_date) {
                conditions.createdAt = { $lt: new Date(req.query.end_date) }
            }
            if (req.query.start_date && req.query.end_date) {
                conditions.createdAt = { $gte: new Date(req.query.start_date), $lt: new Date(req.query.end_date) }
            }
            const data = await transactionModel.find(conditions).populate('userid');
            return data;

        } catch (error) {
            throw error;
        }
    }
    async changeYotuberStatus(req) {
        try {
            const data = await userModel.findOne({ _id: mongoose.Types.ObjectId(req.params.userId) }, { type: 1, username: 1 });

            if (data.type != constant.USER_TYPE.YOUTUBER && !data.type) {
                const updateStatus = await userModel.updateOne({ _id: mongoose.Types.ObjectId(req.params.userId) }, {
                    $set: {
                        type: constant.USER_TYPE.YOUTUBER
                    }
                });
                if (updateStatus.modifiedCount > 0) {
                    return {
                        status: true,
                        message: `${data.username} youtuber type update successfully..active`
                    }
                } else {
                    return {
                        status: false,
                        message: `${data.username} youtuber type can not update ..error`
                    }
                }
            } else {
                const updateStatus = await userModel.updateOne({ _id: mongoose.Types.ObjectId(req.params.userId) }, {
                    $set: {
                        type: null
                    }
                });
                if (updateStatus.modifiedCount > 0) {
                    return {
                        status: true,
                        message: `${data.username} youtuber type update successfully..deactive`
                    }
                } else {
                    return {
                        status: false,
                        message: `${data.username} youtuber type can not update ..error`
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }


}
module.exports = new UserServices();