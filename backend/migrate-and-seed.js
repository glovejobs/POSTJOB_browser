const { exec } = require('child_process');
const path = require('path');

async function setup() {
  console.log('🔧 Setting up database...');
  
  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await runCommand('npx prisma generate');
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    await runCommand('npx prisma db push');
    
    // Seed database
    console.log('🌱 Seeding database...');
    await runCommand('npx prisma db seed');
    
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: path.resolve(__dirname) }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve(stdout);
    });
  });
}

setup();