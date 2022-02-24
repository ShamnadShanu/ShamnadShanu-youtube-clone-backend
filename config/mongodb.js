const MongoCliend=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=(done)=>{
const dbname='youtube'
MongoCliend.connect(process.env.MONGO_CONNECT_URL,(err,data)=>{
    console.log(err);
    if(err)return done(err)
    state.db=data.db(dbname)
    done()
})
}
module.exports.get=function(){
    return state.db
}