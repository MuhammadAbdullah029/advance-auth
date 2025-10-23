const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: { 
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    otp: String,
    otpExpire: Date,
}, { timestamps: true });

userSchema.pre("save", async function(next){
    if(!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = function(plain){
    return bcrypt.compare(plain, this.password);
}

userSchema.methods.genToken = function(){
    return jwt.sign({
        id: this.id, email: this.email
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
}


module.exports = mongoose.model('User', userSchema);