import { NavigatorScreenParams } from '@react-navigation/native';
import { Photo } from './photo';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; fullName?: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  GalleryTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ImageDetails: { photo: Photo };
  MemoryDetails: { memoryId: string };
  PersonProfile: { personId: string };
  Settings: undefined;
};
