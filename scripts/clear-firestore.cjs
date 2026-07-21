const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('C:/Users/ADMIN/Downloads/campus-27248-firebase-adminsdk-fbsvc-226a4833db.json');

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared ${collectionName} (${snapshot.size} docs)`);
}

async function main() {
  console.log('Clearing Firestore collections...\n');
  
  await clearCollection('grades');
  await clearCollection('sections');
  await clearCollection('buildings');
  await clearCollection('computer_labs');
  await clearCollection('baccalaureate_types');
  
  console.log('\nDone! Recarga la app.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
