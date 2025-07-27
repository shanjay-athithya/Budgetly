import mongoose, { Schema, Document } from 'mongoose';

// Income Schema
const IncomeSchema = new Schema({
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    source: { type: String, required: true },
    date: { type: Date, required: true }
}, { _id: false });

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
            income: Array<{
                _id?: mongoose.Types.ObjectId;
                label: string;
                amount: number;
                source: string;
                date: Date;
            }>;
            expenses: Array<{
                _id?: mongoose.Types.ObjectId;
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

    // Instance methods
    addIncome(monthKey: string, incomeEntry: Omit<{ _id?: mongoose.Types.ObjectId; label: string; amount: number; source: string; date: Date }, '_id'>): Promise<IUser>;
    addExpense(monthKey: string, expense: Omit<{ _id?: mongoose.Types.ObjectId; label: string; amount: number; category: string; date: Date; type: 'one-time' | 'emi'; emiDetails?: { duration: number; remainingMonths: number; monthlyAmount: number; startedOn: Date } }, '_id'>): Promise<IUser>;
    getMonthData(monthKey: string): { income: Array<{ _id?: mongoose.Types.ObjectId; label: string; amount: number; source: string; date: Date }>; expenses: Array<{ _id?: mongoose.Types.ObjectId; label: string; amount: number; category: string; date: Date; type: 'one-time' | 'emi'; emiDetails?: { duration: number; remainingMonths: number; monthlyAmount: number; startedOn: Date } }> };
    updateSavings(amount: number): Promise<IUser>;
}

// Static methods interface
export interface IUserModel extends mongoose.Model<IUser> {
    findByUID(uid: string): Promise<IUser | null>;
    findOrCreate(userData: Partial<IUser>): Promise<IUser>;
    migrateIncomeStructure(): Promise<number>;
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
        type: Schema.Types.Mixed,
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
    const monthData = this.months[currentMonth];

    if (!monthData) {
        return { income: [], expenses: [] };
    }

    // Handle migration from old structure (income as number) to new structure (income as array)
    if (typeof monthData.income === 'number') {
        console.log('Migrating income from number to array in currentMonth for month:', currentMonth);
        const oldIncomeAmount = monthData.income;
        monthData.income = [];

        // If there was existing income, create a default entry
        if (oldIncomeAmount > 0) {
            monthData.income.push({
                _id: new mongoose.Types.ObjectId(), // Add MongoDB ObjectId
                label: 'Previous Income',
                amount: oldIncomeAmount,
                source: 'Migration',
                date: new Date(currentMonth + '-01')
            });
        }

        // Update the months object
        this.months[currentMonth] = monthData;
        this.save({ validateBeforeSave: false }); // Save the migration
    }

    return monthData;
});

// Method to add income to a specific month
UserSchema.methods.addIncome = async function (monthKey: string, incomeEntry: any) {
    console.log('🏦 addIncome called with monthKey:', monthKey, 'incomeEntry:', JSON.stringify(incomeEntry, null, 2));

    // Initialize month if it doesn't exist
    if (!this.months[monthKey]) {
        console.log('📅 Initializing new month:', monthKey);
        this.months[monthKey] = { income: [], expenses: [] };
    }

    // Handle migration from old structure (income as number) to new structure (income as array)
    if (typeof this.months[monthKey].income === 'number') {
        console.log('🔄 Migrating income from number to array for month:', monthKey);
        const oldIncomeAmount = this.months[monthKey].income;
        this.months[monthKey].income = [];

        // If there was existing income, create a default entry
        if (oldIncomeAmount > 0) {
            this.months[monthKey].income.push({
                _id: new mongoose.Types.ObjectId(), // Add MongoDB ObjectId
                label: 'Previous Income',
                amount: oldIncomeAmount,
                source: 'Migration',
                date: new Date(monthKey + '-01')
            });
        }
    }

    // Ensure income is an array (handle any other edge cases)
    if (!Array.isArray(this.months[monthKey].income)) {
        console.log('🔄 Converting income to array for month:', monthKey);
        this.months[monthKey].income = [];
    }

    // Add the new income entry with _id
    const newIncomeEntry = {
        ...incomeEntry,
        _id: new mongoose.Types.ObjectId() // Add MongoDB ObjectId
    };
    console.log('➕ Adding new income entry:', JSON.stringify(newIncomeEntry, null, 2));
    this.months[monthKey].income.push(newIncomeEntry);

    console.log('📊 Final months structure for', monthKey, ':', JSON.stringify(this.months[monthKey], null, 2));
    console.log('💰 Total income entries:', this.months[monthKey].income.length);

    // Use findOneAndUpdate instead of save() for better reliability with Mixed types
    console.log('💾 About to update user with months:', JSON.stringify(this.months, null, 2));
    const updatedUser = await (this.constructor as any).findOneAndUpdate(
        { _id: this._id },
        { $set: { months: this.months } },
        { new: true, runValidators: false }
    );
    console.log('✅ User updated successfully. Updated months:', JSON.stringify(updatedUser.months, null, 2));
    return updatedUser;
};

// Method to add expense to a specific month
UserSchema.methods.addExpense = function (monthKey: string, expense: any) {
    if (!this.months[monthKey]) {
        this.months[monthKey] = { income: [], expenses: [] };
    }

    // Add the new expense entry with _id
    const newExpenseEntry = {
        ...expense,
        _id: new mongoose.Types.ObjectId() // Add MongoDB ObjectId
    };
    this.months[monthKey].expenses.push(newExpenseEntry);

    return this.save({ validateBeforeSave: false });
};

// Method to get month data
UserSchema.methods.getMonthData = function (monthKey: string) {
    const monthData = this.months[monthKey] || { income: [], expenses: [] };

    // Handle migration from old structure (income as number) to new structure (income as array)
    if (monthData && typeof monthData.income === 'number') {
        console.log('Migrating income from number to array in getMonthData for month:', monthKey);
        const oldIncomeAmount = monthData.income;
        monthData.income = [];

        // If there was existing income, create a default entry
        if (oldIncomeAmount > 0) {
            monthData.income.push({
                _id: new mongoose.Types.ObjectId(), // Add MongoDB ObjectId
                label: 'Previous Income',
                amount: oldIncomeAmount,
                source: 'Migration',
                date: new Date(monthKey + '-01')
            });
        }

        // Update the months object
        this.months[monthKey] = monthData;
        this.save({ validateBeforeSave: false }); // Save the migration
    }

    return monthData;
};

// Method to update savings
UserSchema.methods.updateSavings = function (amount: number) {
    this.savings = amount;
    return this.save({ validateBeforeSave: false });
};

// Static method to find user by UID
UserSchema.statics.findByUID = function (uid: string) {
    console.log('findByUID called for UID:', uid);
    return this.findOne({ uid }).then((user: IUser | null) => {
        if (user) {
            console.log('findByUID - User found with months:', JSON.stringify(user.months, null, 2));
        }
        return user;
    });
};

// Static method to find or create user
UserSchema.statics.findOrCreate = async function (userData: Partial<IUser>) {
    console.log('findOrCreate called with data:', userData);
    let user = await this.findOne({ uid: userData.uid });
    if (!user) {
        console.log('User not found, creating new user');
        user = new this(userData);
        await user.save({ validateBeforeSave: false });
        console.log('New user created with ID:', user._id);
    } else {
        console.log('User found with ID:', user._id);
    }
    return user;
};

// Static method to migrate all users from old income structure to new array structure
UserSchema.statics.migrateIncomeStructure = async function () {
    console.log('Starting income structure migration...');
    const users = await this.find({});
    let migratedCount = 0;

    for (const user of users) {
        let needsMigration = false;

        // Check each month for old income structure
        for (const [monthKey, monthData] of Object.entries(user.months)) {
            if (monthData && typeof monthData === 'object' && 'income' in monthData) {
                const monthDataObj = monthData as { income: number | Array<{ _id?: mongoose.Types.ObjectId; label: string; amount: number; source: string; date: Date }> };
                if (typeof monthDataObj.income === 'number') {
                    console.log(`Migrating user ${user.uid} month ${monthKey} from income number to array`);
                    const oldIncomeAmount = monthDataObj.income;
                    monthDataObj.income = [];

                    // If there was existing income, create a default entry
                    if (oldIncomeAmount > 0) {
                        monthDataObj.income.push({
                            _id: new mongoose.Types.ObjectId(), // Add MongoDB ObjectId
                            label: 'Previous Income',
                            amount: oldIncomeAmount,
                            source: 'Migration',
                            date: new Date(monthKey + '-01')
                        });
                    }

                    needsMigration = true;
                }
            }
        }

        if (needsMigration) {
            await user.save({ validateBeforeSave: false });
            migratedCount++;
        }
    }

    console.log(`Income structure migration completed. ${migratedCount} users migrated.`);
    return migratedCount;
};

export default mongoose.models.User || mongoose.model<IUser, IUserModel>('User', UserSchema); 