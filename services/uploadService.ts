import { storage, db } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Função principal para salvar o conteúdo que você faz upload
 */
export const realizarUploadEPersistencia = async (arquivo: File) => {
  try {
    // 1. Define onde o arquivo será salvo no Storage (pasta 'documentos/')
    const storageRef = ref(storage, `documentos/${arquivo.name}`);
    
    // 2. Faz o upload físico do arquivo
    const snapshot = await uploadBytes(storageRef, arquivo);
    
    // 3. Pega o link (URL) que o Firebase gerou para esse arquivo
    const urlPublica = await getDownloadURL(snapshot.ref);

    // 4. Salva o registro (nome, link e data) no Banco de Dados (Firestore)
    await addDoc(collection(db, "uploads_iam"), {
      nome: arquivo.name,
      url: urlPublica,
      tipo: arquivo.type,
      dataUpload: serverTimestamp()
    });

    return "Sucesso: Conteúdo armazenado no Firebase.";
  } catch (error) {
    console.error("Erro no processo de salvamento:", error);
    throw error;
  }
};
