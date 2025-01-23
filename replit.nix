{pkgs}: {
  deps = [
    pkgs.git
    pkgs.yarn
    pkgs.python3
    pkgs.nodejs
    pkgs.wkhtmltopdf
    pkgs.postgresql
  ];
}
