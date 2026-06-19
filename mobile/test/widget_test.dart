import 'package:flutter_test/flutter_test.dart';
import 'package:cyberlab_mobile/main.dart';

void main() {
  testWidgets('CyberLab app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CyberLabApp());
    expect(find.textContaining('CyberLab'), findsWidgets);
  });
}
