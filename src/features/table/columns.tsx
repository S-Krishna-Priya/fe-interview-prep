import type { Column, ColumnFilter } from '../../lib/table/types.ts'
import type { User } from './api.ts'

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export const userColumns: Column<User>[] = [
  {
    id: 'name',
    header: 'Name',
    value: (user) => `${user.firstName} ${user.lastName}`,
    cell: (user) => (
      <span className="flex items-center gap-2">
        <img
          src={user.pictureUrl}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          className="h-8 w-8 shrink-0 rounded-full bg-gray-100"
        />
        <span className="font-medium text-gray-900">
          {user.firstName} {user.lastName}
        </span>
      </span>
    ),
    sortable: true,
  },
  { id: 'gender', header: 'Gender', value: (user) => user.gender, sortable: true },
  { id: 'age', header: 'Age', value: (user) => user.age, sortable: true, align: 'right' },
  { id: 'email', header: 'Email', value: (user) => user.email, sortable: true },
  { id: 'country', header: 'Country', value: (user) => user.country, sortable: true },
  {
    id: 'registered',
    header: 'Registered',
    value: (user) => user.registeredAt,
    cell: (user) => dateFormat.format(new Date(user.registeredAt)),
    sortable: true,
  },
]

export const userFilters: ColumnFilter<User>[] = [
  { id: 'gender', label: 'Gender', value: (user) => user.gender },
  { id: 'country', label: 'Country', value: (user) => user.country },
]
