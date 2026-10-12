import { NavigatorScreenParams } from '@react-navigation/native';
import { Photo } from './photo';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ImageDetails: { photo: Photo };
};
