import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // Create order booker users (upsert to avoid duplicates)
    const ahmed = await db.user.upsert({
      where: { username: 'ahmed' },
      update: { phone: '0321-4567890' },
      create: {
        username: 'ahmed',
        password: await hashPassword('123456'),
        name: 'Ahmed Khan',
        email: 'ahmed@alfalah.com',
        phone: '0321-4567890',
        role: 'orderbooker',
      },
    });

    const ali = await db.user.upsert({
      where: { username: 'ali' },
      update: { phone: '0326-2465921' },
      create: {
        username: 'ali',
        password: await hashPassword('123456'),
        name: 'Ali Hassan',
        email: 'ali@alfalah.com',
        phone: '0326-2465921',
        role: 'orderbooker',
      },
    });

    // Create companies
    const cbl = await db.company.upsert({
      where: { id: (await db.company.findFirst({ where: { shortName: 'CBL' } }))?.id || 'dummy-cbl' },
      update: {},
      create: {
        name: 'Colgate Palmolive (CBL)',
        shortName: 'CBL',
        color: '#dc2626',
        active: true,
      },
    });

    const cadbury = await db.company.upsert({
      where: { id: (await db.company.findFirst({ where: { shortName: 'Cadbury' } }))?.id || 'dummy-cadbury' },
      update: {},
      create: {
        name: 'Cadbury (Mondelez)',
        shortName: 'Cadbury',
        color: '#7c3aed',
        active: true,
      },
    });

    const shan = await db.company.upsert({
      where: { id: (await db.company.findFirst({ where: { shortName: 'Shan' } }))?.id || 'dummy-shan' },
      update: {},
      create: {
        name: 'Shan Foods',
        shortName: 'Shan',
        color: '#16a34a',
        active: true,
      },
    });

    // Assign companies to users
    const companies = [cbl, cadbury, shan];
    const users = [ahmed, ali];

    for (const user of users) {
      for (let i = 0; i < companies.length; i++) {
        const existing = await db.userCompany.findUnique({
          where: { userId_companyId: { userId: user.id, companyId: companies[i].id } },
        });
        if (!existing) {
          await db.userCompany.create({
            data: {
              userId: user.id,
              companyId: companies[i].id,
              isPrimary: i === 0,
            },
          });
        }
      }
    }

    // Pakistani wholesale/retail shop names with Lahore areas
    const shopsData = [
      // Monday - Ahmed's route
      { name: 'Al-Madina Trading Co.', ownerName: 'Haji Muhammad Ashraf', phone: '0300-1234567', area: 'Model Town', address: 'Shop 12, Main Market, Model Town, Lahore', routeDay: 'monday', orderbookerId: ahmed.id, balance: 125000, creditLimit: 500000 },
      { name: 'Kareem Brothers Wholesale', ownerName: 'Abdul Kareem', phone: '0321-2345678', area: 'Gulberg', address: '45-A, Gulberg II, Main Boulevard, Lahore', routeDay: 'monday', orderbookerId: ahmed.id, balance: 89000, creditLimit: 350000 },
      { name: 'Malik Traders', ownerName: 'Malik Rafique', phone: '0333-3456789', area: 'DHA', address: 'Block Y, Phase 5, DHA, Lahore', routeDay: 'monday', orderbookerId: ahmed.id, balance: 210000, creditLimit: 750000 },
      { name: 'Rashid & Sons', ownerName: 'Rashid Ahmad', phone: '0345-4567890', area: 'Johar Town', address: 'Plot 23, Block B, Johar Town, Lahore', routeDay: 'monday', orderbookerId: ahmed.id, balance: 45000, creditLimit: 200000 },
      { name: 'Zahid Provision Store', ownerName: 'Zahid Hussain', phone: '0301-5678901', area: 'Garden Town', address: '12-C, Garden Town, Lahore', routeDay: 'monday', orderbookerId: ahmed.id, balance: 167000, creditLimit: 600000 },

      // Tuesday - Ahmed's route
      { name: 'Shahid Wholesale Depot', ownerName: 'Shahid Mehmood', phone: '0322-6789012', area: 'Liberty Market', address: 'Shop 7, Liberty Market, Lahore', routeDay: 'tuesday', orderbookerId: ahmed.id, balance: 78000, creditLimit: 300000 },
      { name: 'Faisal Trading Agency', ownerName: 'Faisal Iqbal', phone: '0334-7890123', area: 'Barkat Market', address: '15-B, Barkat Market, Garden Town, Lahore', routeDay: 'tuesday', orderbookerId: ahmed.id, balance: 340000, creditLimit: 800000 },
      { name: 'Nasir & Company', ownerName: 'Nasir Javed', phone: '0355-8901234', area: 'Township', address: 'Main Road, Township, Lahore', routeDay: 'tuesday', orderbookerId: ahmed.id, balance: 92000, creditLimit: 400000 },
      { name: 'Mughal General Store', ownerName: 'Mughal Tahir', phone: '0302-9012345', area: 'Samanabad', address: 'Street 5, Samanabad, Lahore', routeDay: 'tuesday', orderbookerId: ahmed.id, balance: 23000, creditLimit: 100000 },
      { name: 'Pak Traders', ownerName: 'Imran Pak', phone: '0312-0123456', area: 'Ichhra', address: 'Main Bazaar, Ichhra, Lahore', routeDay: 'tuesday', orderbookerId: ahmed.id, balance: 195000, creditLimit: 650000 },

      // Wednesday - Ahmed's route
      { name: 'Al-Faisal Kiryana', ownerName: 'Faisal Rana', phone: '0323-1234567', area: 'Allama Iqbal Town', address: 'Ravi Block, Allama Iqbal Town, Lahore', routeDay: 'wednesday', orderbookerId: ahmed.id, balance: 56000, creditLimit: 250000 },
      { name: 'Madina Wholesale', ownerName: 'Hafiz Saad', phone: '0346-2345678', area: 'Main Market Gulberg', address: '31-A, Main Market, Gulberg, Lahore', routeDay: 'wednesday', orderbookerId: ahmed.id, balance: 287000, creditLimit: 900000 },
      { name: 'Butt Trading Co.', ownerName: 'Butt Aslam', phone: '0335-3456789', area: 'Mughalpura', address: 'GT Road, Mughalpura, Lahore', routeDay: 'wednesday', orderbookerId: ahmed.id, balance: 15000, creditLimit: 100000 },

      // Thursday - Ali's route
      { name: 'Anees Brothers', ownerName: 'Anees Ahmed', phone: '0303-4567890', area: 'Cantt', address: 'Sarwar Road, Cantt, Lahore', routeDay: 'thursday', orderbookerId: ali.id, balance: 145000, creditLimit: 550000 },
      { name: 'Hanif Provision Store', ownerName: 'Hanif Bhatti', phone: '0347-5678901', area: 'Faisal Town', address: 'Block A, Faisal Town, Lahore', routeDay: 'thursday', orderbookerId: ali.id, balance: 67000, creditLimit: 300000 },
      { name: 'Rana Traders', ownerName: 'Rana Shakeel', phone: '0324-6789012', area: 'Wapda Town', address: 'Plot 45, Wapda Town, Lahore', routeDay: 'thursday', orderbookerId: ali.id, balance: 312000, creditLimit: 850000 },
      { name: 'Chaudhry Wholesale', ownerName: 'Chaudhry Naveed', phone: '0336-7890123', area: 'Valencia Town', address: 'Block B, Valencia Town, Lahore', routeDay: 'thursday', orderbookerId: ali.id, balance: 42000, creditLimit: 150000 },
      { name: 'Sheikh & Sons', ownerName: 'Sheikh Waqas', phone: '0304-8901234', area: 'Green Town', address: 'Main Boulevard, Green Town, Lahore', routeDay: 'thursday', orderbookerId: ali.id, balance: 178000, creditLimit: 600000 },

      // Friday - Ali's route
      { name: 'Imtiaz Store', ownerName: 'Imtiaz Baig', phone: '0325-9012345', area: 'Muslim Town', address: 'College Road, Muslim Town, Lahore', routeDay: 'friday', orderbookerId: ali.id, balance: 95000, creditLimit: 400000 },
      { name: 'Afzal Trading', ownerName: 'Afzal Ranjha', phone: '0337-0123456', area: 'Baghbanpura', address: 'GT Road, Baghbanpura, Lahore', routeDay: 'friday', orderbookerId: ali.id, balance: 230000, creditLimit: 700000 },
      { name: 'Tariq Provision', ownerName: 'Tariq Mehmood', phone: '0305-1234567', area: 'Gulshan Ravi', address: 'Block C, Gulshan Ravi, Lahore', routeDay: 'friday', orderbookerId: ali.id, balance: 11000, creditLimit: 100000 },
      { name: 'Bilal Kiryana Merchants', ownerName: 'Bilal Hussain', phone: '0348-2345678', area: 'Iqbal Park', address: 'Main Market, Iqbal Park, Lahore', routeDay: 'friday', orderbookerId: ali.id, balance: 420000, creditLimit: 1000000 },

      // Saturday - Ali's route
      { name: 'Aslam & Brothers', ownerName: 'Aslam Pervaiz', phone: '0326-3456789', area: 'Sanda', address: 'Main Road, Sanda, Lahore', routeDay: 'saturday', orderbookerId: ali.id, balance: 87000, creditLimit: 350000 },
      { name: 'Khawaja Traders', ownerName: 'Khawaja Kamran', phone: '0338-4567890', area: 'Badami Bagh', address: 'Akbari Mandi, Badami Bagh, Lahore', routeDay: 'saturday', orderbookerId: ali.id, balance: 5000, creditLimit: 100000 },
      { name: 'Yousaf General Store', ownerName: 'Yousaf Masih', phone: '0306-5678901', area: 'Daroghwala', address: 'Street 10, Daroghwala, Lahore', routeDay: 'saturday', orderbookerId: ali.id, balance: 156000, creditLimit: 500000 },
      { name: 'Iqbal Wholesale Market', ownerName: 'Iqbal Bhatti', phone: '0349-6789012', area: 'Shahdara', address: 'Main Bazaar, Shahdara, Lahore', routeDay: 'saturday', orderbookerId: ali.id, balance: 275000, creditLimit: 750000 },

      // Saturday - Ahmed's route
      { name: 'Rehman Wholesale', ownerName: 'Rehman Malik', phone: '0315-1112233', area: 'Anarkali', address: 'Shop 8, Anarkali Bazaar, Lahore', routeDay: 'saturday', orderbookerId: ahmed.id, balance: 185000, creditLimit: 600000 },
      { name: 'Shehzad Trading Co.', ownerName: 'Shehzad Iqbal', phone: '0327-2223344', area: 'Mozang', address: 'Mozang Chungi, Lahore', routeDay: 'saturday', orderbookerId: ahmed.id, balance: 42000, creditLimit: 200000 },
      { name: 'Habib Provision Store', ownerName: 'Habib Ur Rehman', phone: '0339-3334455', area: 'Krishan Nagar', address: 'Main Market, Krishan Nagar, Lahore', routeDay: 'saturday', orderbookerId: ahmed.id, balance: 298000, creditLimit: 800000 },
      { name: 'Ashraf Kiryana', ownerName: 'Ashraf Bajwa', phone: '0308-4445566', area: 'Old Anarkali', address: 'Food Street, Old Anarkali, Lahore', routeDay: 'saturday', orderbookerId: ahmed.id, balance: 67000, creditLimit: 300000 },
      { name: 'Rizwan Brothers', ownerName: 'Rizwan Ahmed', phone: '0350-5556677', area: 'Davis Road', address: '12-D, Davis Road, Lahore', routeDay: 'saturday', orderbookerId: ahmed.id, balance: 130000, creditLimit: 450000 },

      // Sunday - Ahmed's route
      { name: 'Tariq Store Sunday', ownerName: 'Tariq Nawaz', phone: '0316-6667788', area: 'Mall Road', address: 'Mall Road, Lahore', routeDay: 'sunday', orderbookerId: ahmed.id, balance: 220000, creditLimit: 700000 },
      { name: 'Kamal Wholesale Sunday', ownerName: 'Kamal Rana', phone: '0328-7778899', area: 'Queen Road', address: 'Queen Road, Lahore', routeDay: 'sunday', orderbookerId: ahmed.id, balance: 95000, creditLimit: 400000 },

      // Thursday - Ahmed's route
      { name: 'Sajid General Store', ownerName: 'Sajid Hussain', phone: '0318-8889900', area: 'Canal View', address: 'Canal Bank Road, Lahore', routeDay: 'thursday', orderbookerId: ahmed.id, balance: 53000, creditLimit: 250000 },
      { name: 'Waqar Trading', ownerName: 'Waqar Ali', phone: '0340-9990011', area: 'Thokar Niaz Baig', address: 'Main Market, Thokar Niaz Baig, Lahore', routeDay: 'thursday', orderbookerId: ahmed.id, balance: 176000, creditLimit: 550000 },
      { name: 'Nadeem Brothers', ownerName: 'Nadeem Bhatti', phone: '0309-0001122', area: 'Multan Road', address: 'Multan Road, Lahore', routeDay: 'thursday', orderbookerId: ahmed.id, balance: 310000, creditLimit: 900000 },
    ];

    // Create shops (only if they don't exist already - check by name)
    const createdShops = [];
    for (const shopData of shopsData) {
      const existing = await db.shop.findFirst({
        where: { name: shopData.name },
      });
      if (!existing) {
        const shop = await db.shop.create({
          data: shopData,
        });
        createdShops.push(shop);
      } else {
        createdShops.push(existing);
      }
    }

    // Create company balances for shops
    for (const shop of createdShops) {
      for (const company of companies) {
        const existing = await db.shopCompanyBalance.findUnique({
          where: { shopId_companyId: { shopId: shop.id, companyId: company.id } },
        });
        if (!existing) {
          await db.shopCompanyBalance.create({
            data: {
              shopId: shop.id,
              companyId: company.id,
              balance: Math.floor(shop.balance * (0.3 + Math.random() * 0.4)),
            },
          });
        }
      }
    }

    // Create sample transactions
    const transactionTypes = ['recovery', 'credit'] as const;
    const descriptions = {
      recovery: [
        'Cash recovery from shop',
        'Payment received via cheque',
        'Partial payment collected',
        'Easypaisa transfer received',
        'JazzCash payment received',
      ],
      credit: [
        'Goods supplied - FMCG items',
        'Rice bags delivered',
        'Cooking oil supply',
        'Sugar and flour delivery',
        'Tea and spices supply',
        'Beverages supply for stock',
        'Snacks and biscuits delivery',
      ],
    };

    const today = new Date();
    let transactionsCreated = 0;

    for (const shop of createdShops) {
      const numTransactions = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numTransactions; i++) {
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const descList = descriptions[type];
        const description = descList[Math.floor(Math.random() * descList.length)];
        const amount = type === 'recovery'
          ? Math.floor(5000 + Math.random() * 50000)
          : Math.floor(10000 + Math.random() * 100000);

        const daysAgo = Math.floor(Math.random() * 30);
        const txDate = new Date(today);
        txDate.setDate(txDate.getDate() - daysAgo);
        const dateStr = txDate.toISOString().split('T')[0];

        const existingTxn = await db.transaction.findFirst({
          where: {
            shopId: shop.id,
            type,
            amount,
            date: dateStr,
            description,
          },
        });

        if (!existingTxn) {
          // Randomly assign a company to some transactions
          const companyIdx = Math.floor(Math.random() * companies.length);
          const assignedCompany = Math.random() > 0.4 ? companies[companyIdx] : null;

          await db.transaction.create({
            data: {
              shopId: shop.id,
              type,
              amount,
              createdBy: shop.orderbookerId,
              description,
              date: dateStr,
              approved: Math.random() > 0.3,
              companyId: assignedCompany?.id || null,
            },
          });
          transactionsCreated++;
        }
      }
    }

    // Create daily targets for users
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    for (const user of users) {
      const existing = await db.dailyTarget.findUnique({
        where: { orderbookerId_month: { orderbookerId: user.id, month } },
      });
      if (!existing) {
        await db.dailyTarget.create({
          data: {
            orderbookerId: user.id,
            target: 500000,
            month,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Seed data created successfully',
      users: { ahmed: ahmed.id, ali: ali.id },
      companies: { cbl: cbl.id, cadbury: cadbury.id, shan: shan.id },
      shopsCreated: createdShops.length,
      transactionsCreated,
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
