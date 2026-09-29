import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
import { signOut, deleteUser } from 'firebase/auth';
import { ref, onValue, remove, update } from 'firebase/database';
import { auth, database } from '../firebase';

export default function HomeScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [allUsers, setAllUsers] = useState([]); 
  const [editingUserId, setEditingUserId] = useState(null); 
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setIsLoadingUser(false);
      return;
    }

    const userRef = ref(database, `users/${currentUser.uid}`);
    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        if (!editingUserId) {
          setName(data.name || '');
          setEmail(data.email || currentUser.email || '');
          setPhone(data.phone || '');
          setIsEditable(!!data.name ? false : true);
        }
        setIsLoadingUser(false);
      },
      (error) => {
        alert(error.message);
        setIsLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, editingUserId]);

  useEffect(() => {
    const allUsersRef = ref(database, 'users');
    
    const unsubscribe = onValue(allUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedUsers = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setAllUsers(formattedUsers);
      } else {
        setAllUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveOrEdit = async () => {
    if (!isEditable && !editingUserId) {
      setIsEditable(true);
      return;
    }

    if (!name.trim() || !phone.trim()) {
      alert('Por favor, preencha todos os campos antes de salvar.');
      return;
    }

    setIsSaving(true);
    const targetUid = editingUserId ? editingUserId : currentUser?.uid;

    try {
      await update(ref(database, `users/${targetUid}`), {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      alert('Dados atualizados com sucesso!');
      setIsEditable(false);
      setEditingUserId(null); 
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectUserToEdit = (item) => {
    setEditingUserId(item.id);
    setName(item.name || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setIsEditable(true); 
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setIsEditable(false);
    setName('');
    setPhone('');
  };

  const handleDeleteUser = async (targetId, targetName) => {
    const isSelf = targetId === currentUser?.uid;
    const msg = isSelf 
      ? "Tem certeza que deseja apagar seus dados E excluir sua conta permanentemente?"
      : `Deseja realmente excluir permanentemente o cadastro de "${targetName || 'Este usuário'}"?`;

    const confirmar = window.confirm(msg);
    if (!confirmar) return;

    try {
      await remove(ref(database, `users/${targetId}`));
      await remove(ref(database, `user_items/${targetId}`));
      await remove(ref(database, `user_profiles/${targetId}`));

      alert('Cadastro removido com sucesso!');

      if (isSelf) {
        await deleteUser(currentUser);
        navigation.replace('Login');
      } else if (editingUserId === targetId) {
        handleCancelEdit(); 
      }
    } catch (error) {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => navigation.replace('Login'))
      .catch(error => alert(error.message));
  };

  const renderHeader = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Perfil do usuário</Text>
      <Text style={styles.text}>
        {editingUserId ? "Modo de Edição de Cadastro" : `Olá, ${name ? name : currentUser?.email}!`}
      </Text>

      <TextInput
        style={[styles.input, !isEditable && styles.inputDisabled]}
        value={name}
        onChangeText={setName}
        placeholder="Nome"
        editable={isEditable}
      />

      <TextInput
        style={[styles.input, styles.inputDisabled]}
        value={email}
        placeholder="E-mail"
        editable={false} 
      />

      <TextInput
        style={[styles.input, !isEditable && styles.inputDisabled]}
        value={phone}
        onChangeText={setPhone}
        placeholder="Telefone"
        keyboardType="phone-pad"
        editable={isEditable}
      />

      <TouchableOpacity style={styles.button} onPress={handleSaveOrEdit} disabled={isLoadingUser || isSaving}>
        <Text style={styles.buttonText}>
          {isSaving ? 'Salvando...' : editingUserId ? 'Salvar alteração' : isEditable ? 'Salvar dados' : 'Editar dados'}
        </Text>
      </TouchableOpacity>

      {editingUserId && (
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleCancelEdit}>
          <Text style={styles.buttonText}>Cancelar edição</Text>
        </TouchableOpacity>
      )}

      {!editingUserId && (
        <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={() => handleDeleteUser(currentUser?.uid, name)}>
          <Text style={styles.buttonText}>Excluir minha conta</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, styles.buttonLogout]} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>

      <Text style={styles.listSectionTitle}>Usuários Cadastrados no Sistema</Text>
    </View>
  );

  return (
    <FlatList
      data={allUsers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.centerList}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <View style={styles.userCard}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name || 'Sem nome cadastrado'}</Text>
            <Text style={styles.cardDetail}>E-mail: {item.email}</Text>
            <Text style={styles.cardDetail}>Telefone: {item.phone || 'Sem telefone'}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionEditBtn} onPress={() => handleSelectUserToEdit(item)}>
              <Text style={styles.actionBtnText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionDeleteBtn} onPress={() => handleDeleteUser(item.id, item.name)}>
              <Text style={styles.actionBtnText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centerList: { alignItems: 'center', backgroundColor: '#f5f5f5', paddingVertical: 40, paddingHorizontal: 20 },
  formContainer: { width: '100%', maxWidth: 360, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  text: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', maxWidth: 360, backgroundColor: '#fff', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 12 },
  inputDisabled: { backgroundColor: '#eaeaea', color: '#777' },
  button: { width: '100%', maxWidth: 360, backgroundColor: '#0782F9', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonSecondary: { backgroundColor: '#6B7280' },
  buttonDanger: { backgroundColor: '#d9534f' },
  buttonLogout: { backgroundColor: '#333' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  listSectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#444', marginTop: 35, marginBottom: 15, textAlign: 'center' },
  userCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardInfo: { flex: 1, paddingRight: 10 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionEditBtn: { backgroundColor: '#F59E0B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, justifyContent: 'center' },
  actionDeleteBtn: { backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 }
});
