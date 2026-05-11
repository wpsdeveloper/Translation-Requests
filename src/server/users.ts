function getUser(email: string): AppUser | null {
  if (!email) return null;
  const users = getUsers();
  const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase().trim());
  return user || null;
}

function getUsers(): AppUser[] {
  try {
    return getUsersFromAppSheet();
  } catch (e) {
    console.error('Error fetching users from AppSheet:', e);
    return [];
  }
}
