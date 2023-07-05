const teamModel = require('../../models/teamModel');
const mongoose=require("mongoose");
class teamsServices{

    constructor(){
        return {
            editTeam:this.editTeam.bind(this),
            edit_Team_Data:this.edit_Team_Data.bind(this),
            addTeamData:this.addTeamData.bind(this),
        }
    }

    async getTeamData(data){
        let result = await teamModel.find(data);
        return result;
    }

    async editTeam(req){
        let whereObj ={
            _id:req.params.id
        }
        let data = await this.getTeamData(whereObj);
        if(data.length > 0){
            return data[0];
        }
    }
    async edit_Team_Data(req){
        if(req.fileValidationError){
            return{
                status:false,
                message:req.fileValidationError
            }

        }
        let whereObj1 = { _id:req.params.id }
        let data1 = await this.getTeamData(whereObj1);
        const is_already_team=await teamModel.find({_id:{$ne:mongoose.Types.ObjectId(req.params.id)},teamName:req.body.teamName,team_key:data1[0].team_key});
        if(is_already_team.length > 0){
            return{
                status:false,
                message:'Team Name already Exist..'
            }
        } 
        let whereObj ={
            _id:req.params.id
        }
        let doc=req.body;
        delete doc.typename;
        if(req.file){
            doc.logo=`/teams/${req.file.filename}`
            let  uploadImg = await this.getTeamData(whereObj);
            if(uploadImg[0].logo){
                var fs = require('fs');
                var filePath = `public${uploadImg[0].logo}`;
                // console.log("bgggggg,",fs.existsSync(filePath))
                if(fs.existsSync(filePath) == true){
                    fs.unlinkSync(filePath)
                }
            }
        }
        const data=await teamModel.updateOne(whereObj,{$set:doc});
        if(data.modifiedCount == 1){
            return {
                status:true,
                message:"Team Update successfully"
            } 
      }
    }
    async addTeamData(req){
        try{
            if(req.fileValidationError){
                return{
                    status:false,
                    message:req.fileValidationError
                }
    
            }
            async function getRandomCode(){
                let num = Math.floor(Math.random() * 10000) + 90000;
                let checkKey=await teamModel.find({team_key:num});
                if(checkKey.length > 0){
                    getRandomCode();
                }
                return num ;
            };
            let doc={};
            let generatKey=await getRandomCode();
            doc.team_key=generatKey;
            if(req.file){
                doc.logo=`/${req.body.typename}/${req.file.filename}`;
            }
            doc.teamName=req.body.teamName;
            doc.short_name=req.body.short_name;
            doc.color=req.body.color;

            let inertData=new teamModel(doc);
            let saveData=await inertData.save();
            if(saveData){
                return{
                    status:true,
                    message:'add team successfully'
                }
            }else{
                return{
                    status:false,
                    message:'team not add ..something wrong please try letter.'
                }
            }
        }catch(error){
           throw error;
        }
    }

}
module.exports = new teamsServices()