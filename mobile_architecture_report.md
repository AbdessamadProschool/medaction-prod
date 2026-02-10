# 📱 Architecture Technique Masterplan: Médiouna Action Mobile

Ce document est la référence absolue pour l'équipe de développement mobile. Il définit l'architecture, les standards de code, les workflows et les spécifications techniques détaillées pour chaque feature.

---

## 1. 🏗️ Architecture System & Design Patterns

Nous adoptons une **Clean Architecture** stricte couplée au pattern **BLoC** pour la gestion d'état. Cette approche garantit la ségrégation des responsabilités, la testabilité et la maintenance à long terme.

### 1.1 Diagramme de Flux de Données
```mermaid
graph LR
    User((Utilisateur)) --> UI[Pages & Widgets]
    UI --> Event[BLoC Events]
    Event --> Bloc[BLoC / Cubit]
    Bloc --> UseCase{Use Cases (Domain)}
    UseCase --> Repo[Repository Interface]
    Repo --> RepoImpl[Repository Impl (Data)]
    RepoImpl --> Remote[API (Dio)]
    RepoImpl --> Local[Cache (Hive)]
    
    Local --> RepoImpl
    Remote --> RepoImpl
    RepoImpl --> Entity[Business Entities]
    Entity --> UseCase
    UseCase --> State[BLoC States]
    State --> UI
```

---

## 2. 📂 Structure Complète de l'Arborescence

Voici la structure exacte des fichiers à respecter scrupuleusement. Chaque module feature doit être isolé.

```
mediouna_action_mobile/
│
├── android/                 # Configuration Android
├── ios/                     # Configuration iOS
├── assets/                  # Assets statiques
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── translations/        # i18n (FR/AR)
│
├── lib/
│   │
│   ├── main.dart            # Point d'entrée & Initialisation
│   │
│   ├── core/                # COEUR DU SYSTÈME (Transverse)
│   │   │
│   │   ├── constants/       # Constantes globales
│   │   │   ├── app_constants.dart
│   │   │   ├── api_endpoints.dart
│   │   │   ├── app_colors.dart
│   │   │   ├── app_text_styles.dart
│   │   │   └── assets.gen.dart    # Généré automatiquement
│   │   │
│   │   ├── theme/           # Design System
│   │   │   ├── app_theme.dart
│   │   │   ├── light_theme.dart
│   │   │   └── dark_theme.dart
│   │   │
│   │   ├── router/          # Navigation
│   │   │   ├── app_router.dart    # Configuration GoRouter
│   │   │   └── route_names.dart
│   │   │
│   │   ├── network/         # Couche Réseau
│   │   │   ├── dio_client.dart    # Singleton Dio
│   │   │   ├── api_client.dart    # Retrofit Client
│   │   │   ├── interceptors/
│   │   │   │   ├── auth_interceptor.dart
│   │   │   │   ├── logging_interceptor.dart
│   │   │   │   └── error_interceptor.dart
│   │   │   └── network_info.dart  # Checker connectivité
│   │   │
│   │   ├── storage/         # Persistance Locale
│   │   │   ├── hive_storage.dart  # Cache NoSQL
│   │   │   ├── secure_storage.dart # Tokens
│   │   │   └── preferences_helper.dart
│   │   │
│   │   ├── error/           # Gestion Erreurs
│   │   │   ├── failures.dart      # Objets métier (Domain)
│   │   │   ├── exceptions.dart    # Objets techniques (Data)
│   │   │   └── error_handler.dart # Mapper UI
│   │   │
│   │   ├── di/
│   │   │   └── injection_container.dart # Service Locator (GetIt)
│   │   │
│   │   ├── utils/           # Utilitaires
│   │   │   ├── validators.dart
│   │   │   ├── date_formatter.dart
│   │   │   ├── image_helper.dart
│   │   │   └── permission_mapper.dart # RBAC Helper
│   │   │
│   │   └── widgets/         # Composants UI Partagés
│   │       ├── primary_button.dart
│   │       ├── custom_text_field.dart
│   │       ├── loading_indicator.dart
│   │       ├── error_view.dart
│   │       ├── empty_state.dart
│   │       └── custom_app_bar.dart
│   │
│   └── features/            # MODULES METIER (Vertical Slicing)
│       │
│       ├── auth/            # Module Authentification
│       │   ├── data/
│       │   │   ├── models/
│       │   │   │   ├── user_model.dart
│       │   │   │   ├── login_request.dart
│       │   │   │   └── register_request.dart
│       │   │   ├── datasources/
│       │   │   │   ├── auth_remote_ds.dart
│       │   │   │   └── auth_local_ds.dart
│       │   │   └── repositories/
│       │   │       └── auth_repository_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   └── user_entity.dart
│       │   │   ├── repositories/
│       │   │   │   └── auth_repository.dart
│       │   │   └── usecases/
│       │   │       ├── login_usecase.dart
│       │   │       ├── register_usecase.dart
│       │   │       ├── logout_usecase.dart
│       │   │       └── get_current_user.dart
│       │   └── presentation/
│       │       ├── bloc/
│       │       │   ├── auth_bloc.dart
│       │       │   ├── auth_event.dart
│       │       │   └── auth_state.dart
│       │       ├── pages/
│       │       │   ├── login_page.dart
│       │       │   ├── register_page.dart
│       │       │   └── forgot_password_page.dart
│       │       └── widgets/
│       │           └── auth_form_fields.dart
│       │
│       ├── reclamations/    # Module Réclamations
│       │   ├── data/
│       │   │   ├── models/
│       │   │   │   ├── reclamation_model.dart
│       │   │   │   └── create_reclamation_dto.dart
│       │   │   ├── datasources/
│       │   │   │   ├── reclamations_remote_ds.dart
│       │   │   │   └── reclamations_local_ds.dart
│       │   │   └── repositories/
│       │   │       └── reclamations_repo_impl.dart
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   └── reclamation_entity.dart
│       │   │   ├── repositories/
│       │   │   │   └── reclamations_repo.dart
│       │   │   └── usecases/
│       │   │       ├── create_reclamation.dart
│       │   │       ├── get_my_reclamations.dart
│       │   │       ├── get_reclamation_details.dart
│       │   │       └── upload_reclamation_photos.dart
│       │   └── presentation/
│       │       ├── bloc/
│       │       │   ├── reclamations_bloc.dart
│       │       │   ├── reclamations_event.dart
│       │       │   └── reclamations_state.dart
│       │       ├── pages/
│       │       │   ├── reclamations_list_page.dart
│       │       │   ├── create_reclamation_wizard.dart
│       │       │   └── reclamation_details_page.dart
│       │       └── widgets/
│       │           ├── reclamation_card.dart
│       │           ├── status_badge.dart
│       │           └── timeline_widget.dart
│       │
│       ├── etablissements/  # Module Établissements
│       │   # Structure identique...
│       │
│       ├── evenements/      # Module Événements
│       │   # Structure identique...
│       │
│       ├── map/             # Module Carte 3D
│       │   ├── data/
│       │   ├── domain/
│       │   └── presentation/
│       │       └── widgets/
│       │           └── map_view_widget.dart
│       │
│       └── dashboard/       # Module Dashboard
│           └── presentation/
│               └── pages/
│                   └── dashboard_page.dart
│
├── test/                    # Tests Unitaires
│   ├── core/
│   └── features/
│       ├── auth/
│       └── reclamations/
│
├── integration_test/        # Tests E2E
│
├── pubspec.yaml            # Dépendances Project
├── analysis_options.yaml   # Linter Rules
├── .env.example            # Template Config
└── README.md               # Documentation
```

---

## 3. 📦 Configuration `pubspec.yaml`
Voici le fichier de dépendances complet et à jour pour respecter l'architecture définie.

```yaml
name: mediouna_action_mobile
description: Application mobile citoyenne - Province de Médiouna
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # --- Architecture & State ---
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5       # Comparaison d'objets (States/Events)
  get_it: ^7.6.4          # Service Locator
  dartz: ^0.10.1          # Functional Programming (Either)

  # --- Network & Data ---
  dio: ^5.3.3             # HTTP Client puissant
  retrofit: ^4.0.3        # Générateur API Client
  json_annotation: ^4.8.1
  connectivity_plus: ^5.0.1
  flutter_secure_storage: ^9.0.0 # JWT Storage
  hive: ^2.2.3            # NoSQL Local DB
  hive_flutter: ^1.1.0
  shared_preferences: ^2.2.2

  # --- UI Components ---
  go_router: ^12.1.0      # Navigation déclarative
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.9
  shimmer: ^3.0.0         # Loading skeletons
  lottie: ^2.7.0          # Animations JSON
  toastification: ^1.3.3  # Toasts modernes
  google_fonts: ^6.1.0

  # --- Forms & Utils ---
  formz: ^0.6.1           # Validation formulaires
  intl: ^0.18.1           # Dates & Nombres
  flutter_dotenv: ^5.1.0  # Config .env
  uuid: ^4.1.0
  permission_handler: ^11.0.1

  # --- Media ---
  image_picker: ^1.0.4    # Caméra/Galerie
  flutter_image_compress: ^2.1.0 # Compression avant upload

  # --- Maps & Location ---
  mapbox_gl: ^0.16.0      # Carte Vectorielle/3D
  geolocator: ^10.1.0     # Position GPS

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  
  # --- Code Generation ---
  build_runner: ^2.4.6
  json_serializable: ^6.7.1
  retrofit_generator: ^8.0.0
  hive_generator: ^2.0.1
  
  # --- Testing ---
  mocktail: ^1.0.1
  bloc_test: ^9.1.5

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
    - assets/translations/
    - .env
```

---

## 4. 🚀 Implémentation Core

### 4.1 Point d'Entrée (`main.dart`)
Configuration robuste initialisant tous les services critiques avant le lancement de l'UI.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/di/injection_container.dart' as di;
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';

void main() async {
  // 1. Bindings Flutter
  WidgetsFlutterBinding.ensureInitialized();

  // 2. Variables d'Environnement
  await dotenv.load(fileName: ".env");

  // 3. Database Locale
  await Hive.initFlutter();
  // Register Hive Adapters here...

  // 4. Injection de Dépendances
  await di.init();

  runApp(const MediounaActionApp());
}

class MediounaActionApp extends StatelessWidget {
  const MediounaActionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        // AuthBloc est Global (injecté à la racine)
        BlocProvider(
          create: (_) => di.sl<AuthBloc>()..add(const CheckAuthStatusEvent()),
        ),
      ],
      child: MaterialApp.router(
        title: 'Médiouna Action',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system, // Respecte préférence OS
        routerConfig: AppRouter.router,
        localizationsDelegates: const [
          // AppLocalizations.delegate,
          // GlobalMaterialLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('fr', 'FR'),
          Locale('ar', 'MA'),
        ],
      ),
    );
  }
}
```

### 4.2 Injection de Dépendances (`core/di/injection_container.dart`)
Le cerveau qui connecte toutes les pièces du puzzle (Clean Architecture).

```dart
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';

import '../network/dio_client.dart';
import '../network/network_info.dart';

// Imports Auth Feature
import '../../features/auth/data/datasources/auth_remote_ds.dart';
import '../../features/auth/data/datasources/auth_local_ds.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  //! --- Core / External ---
  sl.registerLazySingleton(() => Dio());
  sl.registerLazySingleton(() => const FlutterSecureStorage());
  sl.registerLazySingleton(() => InternetConnectionChecker());
  
  // Custom Wrappers
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl(sl()));
  sl.registerLazySingleton(() => DioClient(sl())); // Injecte le SecureStorage dans Dio

  //! --- Feature: Authentification ---
  
  // BLoC (Factory car stateful et éphémère)
  sl.registerFactory(() => AuthBloc(
    loginUseCase: sl(),
    logoutUseCase: sl(),
    getCurrentUser: sl(),
  ));

  // UseCases (Singleton car stateless)
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => LogoutUseCase(sl()));
  sl.registerLazySingleton(() => GetCurrentUserUseCase(sl()));

  // Repository (Interface -> Implémentation)
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
      networkInfo: sl(),
    ),
  );

  // DataSources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(apiClient: sl<DioClient>().dio),
  );
  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(secureStorage: sl()),
  );
  
  //! --- Feature: Réclamations ---
  // _initReclamations(); ...
}
```

### 4.3 Routing (`core/router/app_router.dart`)
Gestion des routes sécurisées avec redirection automatique.

```dart
import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import 'route_names.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: RouteNames.splash,
    routes: [
      GoRoute(
        path: RouteNames.splash,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: RouteNames.login,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: RouteNames.dashboard,
        builder: (context, state) => const DashboardPage(),
      ),
      // Autres routes...
    ],
    redirect: (context, state) {
      // Logique de Guard
      // TODO: Connecter avec l'état réel du AuthBloc
      final bool isLoggedIn = false; 
      final bool isLoggingIn = state.matchedLocation == RouteNames.login;

      if (!isLoggedIn && !isLoggingIn) return RouteNames.login;
      if (isLoggedIn && isLoggingIn) return RouteNames.dashboard;

      return null;
    },
  );
}
```

Ce document et ces snippets de code constituent la base solide et normalisée pour le développement mobile de **Médiouna Action**. Ils respectent rigoureusement les principes SOLID et Clean Architecture demandés.
