const readline = require('readline');
const db = require('./db');
require('./events/logger'); // Initialize event logger

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to wrap rl.question in a promise for async/await
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit
=====================
  `);

  const ans = await ask('Choose option: ');

  switch (ans.trim()) {
    case '1': // Add Record
      const name = await ask('Enter name: ');
      const value = await ask('Enter value: ');
      await db.addRecord({ name, value });
      console.log('✅ Record added successfully!');
      break;

    case '2': // List Records
      {
        const records = await db.listRecords();
        if (records.length === 0) console.log('No records found.');
        else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
      }
      break;

    case '3': // Update Record
      {
        const id = Number(await ask('Enter record ID to update: '));
        const newName = await ask('New name: ');
        const newValue = await ask('New value: ');
        const updated = await db.updateRecord(id, newName, newValue);
        console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
      }
      break;

    case '4': // Delete Record
      {
        const id = Number(await ask('Enter record ID to delete: '));
        const deleted = await db.deleteRecord(id);
        console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
      }
      break;

    case '5': // Search Records
      {
        const keyword = await ask('Enter search keyword: ');
        const results = await db.searchRecords(keyword);
        if (results.length === 0) console.log('❌ No records found.');
        else {
          console.log(`🔍 Found ${results.length} matching record(s):`);
          results.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
        }
      }
      break;

    case '6': // Sort Records
      {
        let field = (await ask('Choose field to sort by (name/date): ')).trim().toLowerCase();
        if (!['name', 'date'].includes(field)) {
          console.log('❌ Invalid field. Choose "name" or "date".');
          break;
        }
        let order = (await ask('Choose order (asc/desc): ')).trim().toLowerCase();
        if (!['asc', 'desc'].includes(order)) {
          console.log('❌ Invalid order. Choose "asc" or "desc".');
          break;
        }

        const records = await db.listRecords();
        let sortedRecords = [...records]; // copy array

        if (field === 'name') {
          sortedRecords.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
          });
        } else {
          sortedRecords.sort((a, b) => {
            const dateA = new Date(a.created || 0);
            const dateB = new Date(b.created || 0);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
          });
        }

        console.log('📋 Sorted Records:');
        sortedRecords.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
      }
      break;

    case '7': // Export Data
      {
        const filePath = await db.exportVault();
        console.log(`✅ Data exported successfully to ${filePath}`);
      }
      break;

    case '8': // Vault Statistics
      {
        const stats = await db.vaultStats();
        if (!stats) console.log('❌ No records in vault.');
        else {
          console.log('Vault Statistics:\n--------------------------');
          console.log(`Total Records: ${stats.totalRecords}`);
          console.log(`Last Modified: ${stats.lastModified}`);
          console.log(`Longest Name: ${stats.longestName}`);
          console.log(`Earliest Record: ${stats.earliest}`);
          console.log(`Latest Record: ${stats.latest}`);
        }
      }
      break;

    case '9': // Exit
      console.log('👋 Exiting NodeVault...');
      rl.close();
      return;

    default:
      console.log('Invalid option.');
  }

  menu(); // loop menu
}

menu();

