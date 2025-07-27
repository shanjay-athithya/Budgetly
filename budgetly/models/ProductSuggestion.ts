import mongoose, { Schema, Document } from 'mongoose';

export interface IProductSuggestion extends Document {
    uid: string;
    productName: string;
    price: number;
    emiAmount?: number;
    duration?: number;
    suggestionScore: 'Good' | 'Moderate' | 'Risky';
    reason: string;
    suggestedAt: Date;
}

const ProductSuggestionSchema = new Schema<IProductSuggestion>({
    uid: {
        type: String,
        required: true,
        index: true
    },
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    emiAmount: {
        type: Number
    },
    duration: {
        type: Number
    },
    suggestionScore: {
        type: String,
        enum: ['Good', 'Moderate', 'Risky'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    suggestedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
ProductSuggestionSchema.index({ uid: 1 });
ProductSuggestionSchema.index({ suggestedAt: -1 });
ProductSuggestionSchema.index({ uid: 1, suggestedAt: -1 });

// Static method to find suggestions by user
ProductSuggestionSchema.statics.findByUser = function (uid: string, limit = 10) {
    return this.find({ uid })
        .sort({ suggestedAt: -1 })
        .limit(limit);
};

// Static method to get suggestion statistics
ProductSuggestionSchema.statics.getStats = function (uid: string) {
    return this.aggregate([
        { $match: { uid } },
        {
            $group: {
                _id: '$suggestionScore',
                count: { $sum: 1 },
                totalValue: { $sum: '$price' }
            }
        }
    ]);
};

// Static methods interface
export interface IProductSuggestionModel extends mongoose.Model<IProductSuggestion> {
    findByUser(uid: string, limit?: number): Promise<IProductSuggestion[]>;
    getStats(uid: string): Promise<any>;
}

export default mongoose.models.ProductSuggestion as IProductSuggestionModel || mongoose.model<IProductSuggestion, IProductSuggestionModel>('ProductSuggestion', ProductSuggestionSchema); 