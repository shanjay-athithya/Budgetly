import mongoose, { Schema, Document } from 'mongoose';

// EMI Details Schema
const EMIDetailsSchema = new Schema({
    duration: { type: Number, required: true }, // in months
    remainingMonths: { type: Number, required: true },
    monthlyAmount: { type: Number, required: true },
    startedOn: { type: Date, required: true }
}, { _id: false });

// Expense Schema
const ExpenseSchema = new Schema({
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['one-time', 'emi'], required: true },
    emiDetails: { type: EMIDetailsSchema, required: false }
}, { _id: false });

// Month Data Schema
const MonthDataSchema = new Schema({
    income: { type: Number, default: 0 },
    expenses: [ExpenseSchema]
}, { _id: false });

// User Schema
export interface IUser extends Document {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    savings: number;
    location?: string;
    occupation?: string;
    months: {
        [monthKey: string]: {
            income: number;
            expenses: Array<{
                label: string;
                amount: number;
                category: string;
                date: Date;
                type: 'one-time' | 'emi';
                emiDetails?: {
                    duration: number;
                    remainingMonths: number;
                    monthlyAmount: number;
                    startedOn: Date;
                };
            }>;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    uid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    photoURL: {
        type: String
    },
    savings: {
        type: Number,
        default: 0
    },
    location: {
        type: String
    },
    occupation: {
        type: String
    },
    months: {
        type: Map,
        of: MonthDataSchema,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better query performance (removed duplicates)
UserSchema.index({ uid: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'months': 1 });

// Virtual for getting current month data
UserSchema.virtual('currentMonth').get(function () {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return this.months.get(currentMonth) || { income: 0, expenses: [] };
});

// Method to add income to a specific month
UserSchema.methods.addIncome = function (monthKey: string, amount: number) {
    const monthData = this.months.get(monthKey) || { income: 0, expenses: [] };
    monthData.income += amount;
    this.months.set(monthKey, monthData);
    return this.save();
};

// Method to add expense to a specific month
UserSchema.methods.addExpense = function (monthKey: string, expense: any) {
    const monthData = this.months.get(monthKey) || { income: 0, expenses: [] };
    monthData.expenses.push(expense);
    this.months.set(monthKey, monthData);
    return this.save();
};

// Method to get month data
UserSchema.methods.getMonthData = function (monthKey: string) {
    return this.months.get(monthKey) || { income: 0, expenses: [] };
};

// Method to update savings
UserSchema.methods.updateSavings = function (amount: number) {
    this.savings = amount;
    return this.save();
};

// Static method to find user by UID
UserSchema.statics.findByUID = function (uid: string) {
    return this.findOne({ uid });
};

// Static method to find or create user
UserSchema.statics.findOrCreate = async function (userData: any) {
    let user = await this.findOne({ uid: userData.uid });
    if (!user) {
        user = new this(userData);
        await user.save();
    }
    return user;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 