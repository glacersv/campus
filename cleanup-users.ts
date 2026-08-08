import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATVsRNPWADga7le5h8bxogza_HVmQr_Z8",
  authDomain: "campus-27248.firebaseapp.com",
  projectId: "campus-27248",
  storageBucket: "campus-27248.firebasestorage.app",
  messagingSenderId: "284451559767",
  appId: "1:284451559767:web:d29c533a5e69a8d7ce8612"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupUsers() {
  console.log('🔍 Obteniendo todos los usuarios...');
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const users = snapshot.docs.map(d => ({
    uid: d.id,
    ...d.data()
  }));

  console.log(`📊 Total usuarios encontrados: ${users.length}`);

  // Usuarios a mantener
  const usersToKeep = users.filter(u => {
    const isSuperAdmin = u.email === 'jose.marquez@salesianosanjose.edu.sv';
    const isAdmin = u.email === 'admin@salesianosanjose.edu.sv';
    const isDocente = u.role === 'docente';
    return isSuperAdmin || isAdmin || isDocente;
  });

  const usersToDelete = users.filter(u => {
    const isAdmin = u.email === 'jose.marquez@salesianosanjose.edu.sv';
    const isDocente = u.role === 'docente';
    return !isAdmin && !isDocente;
  });

  console.log(`\n✅ Usuarios a mantener (${usersToKeep.length}):`);
  usersToKeep.forEach(u => {
    console.log(`  - ${u.displayName} (${u.email}) - ${u.role}`);
  });

  console.log(`\n🗑️  Usuarios a eliminar (${usersToDelete.length}):`);
  usersToDelete.forEach(u => {
    console.log(`  - ${u.displayName} (${u.email}) - ${u.role || 'sin rol'}`);
  });

  if (usersToDelete.length === 0) {
    console.log('\n✨ No hay usuarios para eliminar.');
    return;
  }

  console.log('\n⚠️  ¿Estás seguro? Esta acción no se puede deshacer.');
  console.log('   Ejecuta con CONFIRM=true para proceder.');

  if (process.env.CONFIRM === 'true') {
    console.log('\n🚀 Eliminando usuarios...');
    for (const user of usersToDelete) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        console.log(`  ✓ Eliminado: ${user.displayName} (${user.email})`);
      } catch (error) {
        console.error(`  ✗ Error eliminando ${user.email}:`, error);
      }
    }
    console.log('\n✅ Limpieza completada.');
  } else {
    console.log('\n❌ Operación cancelada. Ejecuta con CONFIRM=true para confirmar.');
  }
}

cleanupUsers().catch(console.error);
