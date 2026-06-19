/// API base URL for the CyberLab backend.
///
/// Override at build/run time:
///   flutter run --dart-define=API_URL=http://192.168.1.10:5000/api
///
/// Defaults for Android emulator (10.0.2.2 = host machine from emulator):
/// - API: http://10.0.2.2:5000/api
/// Physical phone: --dart-define=API_URL=http://192.168.x.x:5000/api
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  static const String webAppUrl = String.fromEnvironment(
    'WEB_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}
