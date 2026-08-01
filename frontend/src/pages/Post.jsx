import { useState, useEffect } from "react"
import AddPost from "../components/AddPost"
import Spinner from "../components/Spinner"
import { useParams, useNavigate } from "react-router-dom"
import toast from 'react-hot-toast'
import Avatar from "../components/Avatar"
import Placeholder from "../components/Placeholder"
import Upload from "../components/Upload"
import FollowButton from "../components/FollowButton"
import ProfilePost from "../components/ProfilePost"
import ProfileRecommend from "../components/ProfileRecommend"
import UnfollowButton from "../components/UnfollowButton"
import { useAuth } from "../context/AuthContext"
import { useApp } from "../context/AppContext"

const Post = () => {
    const [post, setPost] = useState({})
    const [loading, setLoading] = useState(true)
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, setUser } = useAuth()
    const {
        comments,
        setComments,
        accountUser,
        setAccountUser,
        addComment,
        likePost,
        unlikePost,
        followUser,
        unfollowUser,
        deletePost,
        uploadPhoto
    } = useApp()

    useEffect( () => {
        const controller = new AbortController()
        setLoading(true)
        setPost(null)
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/post/${id}`, {
                    credentials: 'include',
                    signal: controller.signal
              })
                const data = await res.json()

                if ( res.ok ) {
                    if ( data ) {
                        setPost(data.post)
                        setComments(data.comments)
                        setAccountUser(data.accountUser)
                    }

                    setLoading(false)
                } else {
                    console.error('Error fetching data:', data.message)
                    toast.error(data.message)

                    setLoading(false)
                }

            } catch (error) {
                if ( error.name === 'AbortError') {
                    console.log('Request was cancelled');
                    return; // Stop execution, no state should be set.
                }

                console.error('Error fetching data:',error)
                toast.error('Could not connect to the server')
                
                setLoading(false)
            }
        }
        fetchData()
        
        return () => {
            controller.abort(); 
        }
    }, [id])
    
    const handleLikePost = ( postId ) => {
        const updatedPost = ( data ) => {
            setPost( prevPost => ( 
                prevPost?._id === postId ?
                { ...prevPost, likes: data.updatedLike.likes }
                : prevPost
            ))

            setAccountUser( prevAccountUser => ( 
                prevAccountUser?._id === user?._id ?
                    {...prevAccountUser, likedPostId: data.updatedUser.likedPostId }
                    : prevAccountUser ))
                    
            toast.success(data.message)
        }
    
        likePost( postId, updatedPost, `/api/post/likePost/`)
    }
    
    const handleUnlikePost = ( postId ) => {
        const updatedPost = ( data ) => {
            setPost( prevPost => (
                prevPost?._id === postId ?
                { ...prevPost, likes: data.updatedLike.likes }
                : prevPost ))

            setAccountUser( prevAccountUser => (
                prevAccountUser?._id === user?._id ?
                {...prevAccountUser, likedPostId: data.updatedUser.likedPostId }
                : prevAccountUser ))

            toast.success(data.message)
        }

        unlikePost( postId, updatedPost, `/api/post/minusLikePost/`)
    }

    const handleFollowUser = ( postId ) => {
        const updatedUser = ( data ) => {
            if ( data.updatedFollow ) {
                setAccountUser( prevAccountUser => ({...prevAccountUser, followerId: data.updatedFollow.followerId}))
                toast.success(data.message)
            }
        }
            
        followUser( postId, updatedUser, '/api/post/followUser/')
    }

    const handleUnfollowUser = ( postId ) => {
        const updatedUser = ( data ) => {
            if ( data.updatedUnfollow ) {
                setAccountUser( prevAccountUser => ({...prevAccountUser, followerId: data.updatedUnfollow.followerId }))
                toast.success(data.message)
            }
        }

        unfollowUser( postId, '/api/profile/unfollowUser/', updatedUser )
    }

    const handleDeletePost = ( postId ) => {
        const updatedPost = () => {
            setPost({})
            navigate(`/profile/${user?._id}`)
        }

        deletePost( postId, updatedPost, `/api/post/deletePost/` )
    }

  return (
    <section>
      <section className="flex flex-wrap justify-start min-h-125">
              { loading ? (
                     <Spinner loading={loading} />
               ): (
                  <>
                      <section className="w-3/4 md:w-1/4 py-12 px-2">
                          <div className="flex md:flex-wrap sm:no-wrap flex-wrap justify-around">
                              <div className="w-full sm:w-1/3 md:w-full">
                                  {/* Upload Button for User */}
                                  { accountUser?._id === user?._id ? (
                              
                                      accountUser?.profileImage && (
                                          <Upload 
                                            submitPhoto={(formData, selectedImg)=> uploadPhoto( formData, `/api/post/uploadProfilePhoto`, selectedImg)}
                                            user={user}
                                        />
                                      )
                                      
                                  ) : (
                                    <>
                                        {accountUser?.profileImage ?
                                                
                                            <Avatar src={accountUser?.profileImage} user={accountUser} classNameOne='w-full' classNameTwo="w-20 mx-auto" />
                                            : /* No Profile Image */
                                            <Placeholder user={accountUser} classNameOne='w-full' classNameTwo='w-20 mx-auto'/>}

                                        {accountUser?.followerId?.includes(user?._id) ? (
                                                <UnfollowButton
                                                    classNameOne='mt-2'
                                                    userId={accountUser?._id}
                                                    unfollowUser={ handleUnfollowUser }
                                                    containerClassName="w-20 mx-auto"
                                                    />
                                        ):(
                                                    <FollowButton
                                                        classNameOne='mt-2'
                                                        userId={accountUser?._id}
                                                        followUser={handleFollowUser}
                                                    />
                                        )}
                                    </>
                                  )}
                              {/* Profile Details */}
                              { accountUser?._id === user?._id ? 
                                  <div className='w-full'>
                                      <p className="text-center"><strong>Email</strong>: { accountUser?.email } </p>
                                      <p className="text-center"><strong>User Name</strong>: { post?.userName?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') } </p>
                                  </div>
                                  : <p className="text-center"><strong>Email</strong>: { accountUser?.email } </p> }
      
                              </div>
                              {/* <div className="w-full sm:w-2/3 md:w-full grow-1 px-2">
      
                              { accountUser?._id === user?._id && <AddPost width='w-full grow-2' classNameOne="pt-4 text-center" divWidth='w-full' addPost={addPost} />}
                              </div> */}
                          </div>
                      </section>
                      
                      {/* Profile Feed for users without post */}
                      <section className="w-full md:w-2/4 order-3 md:order-2 pt-4 px-1">
                          <ul className="mt-5">
                                    <ProfilePost
                                        key={post?._id}
                                        post={post}
                                        comments={comments}
                                        user={user}
                                        accountUser={accountUser} 
                                        likePost={handleLikePost}
                                        unlikePost={handleUnlikePost}
                                        deletePost={handleDeletePost}
                                        classNameOne="w-full"
                                        addComment={( comment, postId ) => addComment( comment, postId, `/api/post/comments/`)}
                                    />
                          </ul>            
                      </section>
                      
                      {/* Friends List Section of User */}
                      <section className="w-1/4 order-2 md:order-3 px-2">
                          {/* <Recommend /> */}
                          <h3 className="text-center pt-4"><strong>{ accountUser?._id === user?._id ? 'My Friends' : `${accountUser?.userName}'s Friends` }</strong></h3>
                          <div className="card w-full bg-base-100 card-xs shadow-sm">
                              <div className="card-body">
                                      {accountUser?.followingId?.length == 0 ? (
                                          /* if without friends yet */
                                          <h3 className="text-center">No Friends yet</h3>
                                      ) : ( /* if with friends */
                                          <ul className="flex flex-wrap justify-center">
                                              {accountUser?.followingId?.slice(0,4).map( following => (
                                                  <ProfileRecommend key={following?._id} following={following} /*onClick={handleClick}*/ />
                                              ))}
                                          </ul>
                                      )}
                              </div>
                          </div>
                      </section>
                  </>
              )}
          </section>
    </section>
  )
}

export default Post
