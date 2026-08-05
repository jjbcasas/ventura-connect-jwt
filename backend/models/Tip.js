import mongoose, { Schema } from "mongoose"

const tipSchema = new mongoose.Schema(
    {
        tipperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true
        },/*,
        session: {
            type: String,
            required: true
        }*/
        stripeSessionId: {
            type: String,
            required: true,
            unique: true,
            trim: true
       }
    },
    {
        timestamps: true, // creates createdAt and updatedAt field
        // You can also use transform inside toJson to hide sensitive data like password
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

tipSchema.virtual('amountWithSign').get( function() {
    return `$${this.amount.toFixed(2)}`
})

tipSchema.pre(/^find/, function ( next ) {
    this.populate('tipperId creatorId', 'userName')

    next()
})

export default mongoose.model("Tip", tipSchema)