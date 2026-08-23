class AuthSession {
  final String token;
  final String expiresAt;
  final String userId;
  final String name;
  final String email;

  const AuthSession({
    required this.token,
    required this.expiresAt,
    required this.userId,
    required this.name,
    required this.email,
  });

  bool get isExpired {
    final expiry = DateTime.tryParse(expiresAt);
    if (expiry == null) return true;
    return DateTime.now().toUtc().isAfter(expiry.toUtc());
  }

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: json['token'] as String,
      expiresAt: json['expiresAt'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'expiresAt': expiresAt,
      'userId': userId,
      'name': name,
      'email': email,
    };
  }
}
