import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database'; 
import { auth, database } from '../firebase'; 

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCredentials = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      alert('Preencha o e-mail e a senha antes de continuar.');
      return null;
    }

    if (trimmedPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return null;
    }

    return { email: trimmedEmail, password: trimmedPassword };
  };

  const handleLogin = async () => {
    const credentials = validateCredentials();
    if (!credentials) return;

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      navigation.replace('Home');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    const credentials = validateCredentials();
    if (!credentials) return;

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;

      await set(ref(database, `users/${user.uid}`), {
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      navigation.replace('Home');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo</Text>
      
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Aguarde...' : 'Entrar'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.buttonOutline]}
        onPress={handleSignUp}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonOutlineText}>{isSubmitting ? 'Cadastrando...' : 'Cadastrar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '80%', maxWidth: 300, backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  button: { width: '80%', maxWidth: 300, backgroundColor: '#0782F9', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonOutline: { backgroundColor: '#fff', marginTop: 10, borderWidth: 2, borderColor: '#0782F9' },
  buttonOutlineText: { color: '#0782F9', fontWeight: '700', fontSize: 16 }
});
