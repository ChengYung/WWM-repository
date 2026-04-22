import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  increment,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Player, Project, TeamConfig, MartialArts, Technique, UserProfile } from '../types';
import { 
  INITIAL_MARTIAL_ARTS, 
  TEAMS, 
  INITIAL_TEAM_DESCRIPTIONS, 
  INITIAL_TECHNIQUES 
} from '../constants';

export const ProjectService = {
  // User Management
  async ensureUserProfile(uid: string, email: string | null) {
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const profile: UserProfile = {
          uid,
          email,
          plan: 'free',
          maxProjects: 1, // Default is 1 project per account
          createdAt: Date.now()
        };
        await setDoc(userRef, profile);
        return profile;
      }
      return snap.data() as UserProfile;
    } catch (error: any) {
      // 403 Forbidden or other errors shouldn't crash the app
      console.warn("User profile check skipped or failed:", error.message);
      return null;
    }
  },

  subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snap) => {
      callback(snap.exists() ? (snap.data() as UserProfile) : null);
    });
  },

  // Admin Methods
  async getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  },

  async getAllProjects() {
    const snap = await getDocs(collection(db, 'projects'));
    return snap.docs.map(d => d.data() as Project);
  },

  async updateUserLimit(uid: string, maxProjects: number) {
    return updateDoc(doc(db, 'users', uid), { maxProjects });
  },

  async updateProjectMetadata(projectId: string, updates: { 
    expirationDate?: number; 
    isPremium?: boolean; 
    isRestricted?: boolean;
    restrictionMessage?: string;
  }) {
    return updateDoc(doc(db, 'projects', projectId), updates);
  },

  // Projects
  async createProject(name: string, ownerId: string, ownerEmail: string | null) {
    const projectRef = doc(collection(db, 'projects'));
    // Default expiration: 14 days from now (2 weeks)
    const expirationDate = Date.now() + (14 * 24 * 60 * 60 * 1000);
    
    const project: Project = {
      id: projectRef.id,
      name,
      ownerId,
      ownerEmail: ownerEmail || '',
      createdAt: Date.now(),
      expirationDate,
      martialArts: INITIAL_MARTIAL_ARTS,
      teams: TEAMS,
      teamDescriptions: INITIAL_TEAM_DESCRIPTIONS,
      techniques: INITIAL_TECHNIQUES,
      playerCount: 0,
      isPremium: false
    };
    await setDoc(projectRef, project);
    return project;
  },

  subscribeToProjects(ownerId: string, callback: (projects: Project[]) => void) {
    const q = query(collection(db, 'projects'), where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as Project));
    });
  },

  async getProject(projectId: string) {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Project) : null;
  },

  updateProject(projectId: string, updates: Partial<Project>) {
    const docRef = doc(db, 'projects', projectId);
    return updateDoc(docRef, updates);
  },

  async deleteProject(projectId: string) {
    const docRef = doc(db, 'projects', projectId);
    return deleteDoc(docRef);
  },

  // Players
  subscribeToPlayers(projectId: string, callback: (players: Player[]) => void) {
    const q = query(collection(db, 'projects', projectId, 'players'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Player)));
    });
  },

  async addPlayer(projectId: string, player: Omit<Player, 'id'>) {
    const playerRef = doc(collection(db, 'projects', projectId, 'players'));
    const projectRef = doc(db, 'projects', projectId);
    
    const batch = writeBatch(db);
    batch.set(playerRef, { ...player, id: playerRef.id, projectId });
    batch.update(projectRef, { playerCount: increment(1) });
    
    await batch.commit();
    return playerRef.id;
  },

  async updatePlayers(projectId: string, updates: { id: string; team: string }[]) {
    const batch = writeBatch(db);
    updates.forEach(u => {
      const ref = doc(db, 'projects', projectId, 'players', u.id);
      batch.update(ref, { team: u.team });
    });
    return batch.commit();
  },

  async updatePlayer(projectId: string, player: Player) {
    const ref = doc(db, 'projects', projectId, 'players', player.id);
    return setDoc(ref, player);
  },

  async deletePlayer(projectId: string, playerId: string) {
    const playerRef = doc(db, 'projects', projectId, 'players', playerId);
    const projectRef = doc(db, 'projects', projectId);
    
    const batch = writeBatch(db);
    batch.delete(playerRef);
    batch.update(projectRef, { playerCount: increment(-1) });
    
    return batch.commit();
  },

  async clearAllPlayers(projectId: string, playerIds: string[]) {
    const batch = writeBatch(db);
    const projectRef = doc(db, 'projects', projectId);
    
    playerIds.forEach(id => {
      batch.delete(doc(db, 'projects', projectId, 'players', id));
    });
    
    batch.update(projectRef, { playerCount: 0 });
    return batch.commit();
  }
};
