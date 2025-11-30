import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

callbacks: {
  async signIn({ user }) {
    try {
      const email = user.email;

      console.log("🔵 Google SignIn →", email);

      // 1) El usuario ya autenticó con Google Verificar si existe en BD
      const resp = await axios.post(
        "http://localhost:3000/api/auth/loginGoogle",
        { correo: email }
      );

      const data = resp.data;

      // Usuario existe, permitir login normal
      if (data.ok && !data.requiereRegistro) {
          console.log("Usuario existente");
          return true;
        }

      // Usuario NO existe ,  bloquear login y redirigir después
      if (data.requiereRegistro) {
        //  NextAuth SOLO acepta URL ABSOLUTA aquí
        return `http://localhost:3001/registro?correo=${email}`;
      }

      return false;
    } catch (err) {
      console.log(" Error signIn Google:", err.message);
      return false;
    }
  },


   async session({ session }) {
      return session;
    },
},

});

export { handler as GET, handler as POST };
