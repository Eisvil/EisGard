"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import type { AdminUser, UserRole } from "@/lib/types";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  points: number;
  public_name: string | null;
  created_at: string;
};

const roleLabels: Record<UserRole, string> = {
  participant: "Участник",
  moderator: "Модератор",
  editor: "Редактор",
  admin: "Администратор",
  superadmin: "Суперадмин"
};

const editableRoles: UserRole[] = ["participant", "moderator", "admin"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function mapUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? "",
    phone: row.phone ?? "",
    role: row.role,
    points: row.points,
    publicName: row.public_name ?? "",
    createdAt: formatDate(row.created_at)
  };
}

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/admin/users");
        const result = (await response.json()) as { ok?: boolean; users?: UserRow[]; message?: string };

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "Не удалось загрузить пользователей");
        }

        if (!isMounted) {
          return;
        }

        const mappedUsers = (result.users ?? []).map(mapUser);
        setUsers(mappedUsers);
        setSelectedUserId(mappedUsers[0]?.id ?? "");
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить пользователей");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      return [user.email, user.name, user.publicName, roleLabels[user.role]].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? filteredUsers[0];

  async function patchUserRole(role: UserRole) {
    if (!selectedUser) {
      return;
    }

    setIsSaving(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось обновить роль");
      }

      setUsers((currentUsers) => currentUsers.map((user) => (user.id === selectedUser.id ? { ...user, role } : user)));
      setSavedMessage("Роль пользователя обновлена.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось обновить роль");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="admin-panel">Загружаем пользователей...</div>;
  }

  return (
    <div className="admin-editor-layout users-layout">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Пользователи</h3>
        </div>

        {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

        <div className="admin-filters-row">
          <label>
            <Search size={17} />
            <input value={query} placeholder="Поиск по email, имени или роли" onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Имя</th>
                <th>Роль</th>
                <th>Баллы</th>
                <th>Создан</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.id === selectedUser?.id ? "is-selected" : ""} onClick={() => setSelectedUserId(user.id)}>
                  <td>{user.email}</td>
                  <td>{user.name || user.publicName || "не указано"}</td>
                  <td>{roleLabels[user.role]}</td>
                  <td>{user.points}</td>
                  <td>{user.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="admin-panel admin-form-panel">
        {selectedUser ? (
          <>
            <div className="admin-panel__head">
              <h3>Статус пользователя</h3>
            </div>
            {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
            <div className="volunteer-card">
              <div>
                <span>Email</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div>
                <span>Текущая роль</span>
                <strong>{roleLabels[selectedUser.role]}</strong>
              </div>
            </div>
            <label>
              Назначить статус
              <select value={selectedUser.role} onChange={(event) => patchUserRole(event.target.value as UserRole)} disabled={isSaving}>
                {editableRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={() => patchUserRole(selectedUser.role)} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? "Сохраняем..." : "Сохранить статус"}
            </button>
            <div className="admin-muted-line">
              `admin` видит админ-панель. `moderator` не видит админ-панель; роль зарезервирована для будущей модерации комментариев.
            </div>
          </>
        ) : (
          <div className="admin-muted-line">Пользователей пока нет.</div>
        )}
      </aside>
    </div>
  );
}
