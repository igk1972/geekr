import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { getProfile } from 'src/store/actions/profile'
import UserPageSkeleton from 'src/components/skeletons/Profile'
import ErrorComponent from 'src/components/blocks/Error'
import Profile from './pages/Profile'
import { useSelector } from 'src/hooks'
import { useDispatch } from 'react-redux'
import OutsidePage from 'src/components/blocks/OutsidePage'

export interface ComponentWithUserParams {
  classes?: string
}

export interface UserParams {
  login: string
}

const User = () => {
  const dispatch = useDispatch()
  const profile = useSelector((state) => state.profile.profile.user.data)
  const isUserFetched = useSelector(
    (state) => state.profile.profile.user.fetched
  )
  const isUserFetching = useSelector(
    (state) => state.profile.profile.user.fetching
  )
  const userFetchError = useSelector(
    (state) => state.profile.profile.user.error
  )
  const { login } = useParams<UserParams>()

  useEffect(() => {
    if (profile?.login !== login) dispatch(getProfile(login))
  }, [login, profile, dispatch])

  return (
    <OutsidePage
      headerText={login ? '@' + login : null}
      hidePositionBar
      shrinkedHeaderText={profile?.fullname}
    >
      {userFetchError && <ErrorComponent message={userFetchError} />}
      {isUserFetched && <Profile />}
      {isUserFetching && <UserPageSkeleton />}
    </OutsidePage>
  )
}

export default React.memo(User)
