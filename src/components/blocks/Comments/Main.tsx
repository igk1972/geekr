import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import { getComments } from '../../../api'
import Comment from './Comment'
import LinearProgress from '@material-ui/core/LinearProgress'
import Fade from '@material-ui/core/Fade'
import { Comments as IComments } from 'src/interfaces'
import isInViewport from 'src/utils/isInViewport'

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.background.default,
    paddingTop: theme.spacing(1),
  },
  headerContainer: {
    marginBottom: theme.spacing(1),
  },
  header: {
    fontFamily: 'Google Sans',
    fontWeight: 800,
    fontSize: 20,
  },
  commentsNumber: {
    color: theme.palette.primary.main,
    marginLeft: 4,
  },
  comments: {
    backgroundColor: theme.palette.background.paper,
    paddingBottom: theme.spacing(2),
    paddingTop: 0.05,
  },
  progress: {
    marginTop: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
  },
}))

const MIN_COMMENTS_SLICE = 25
const SCROLL_OFFSET = 256

const Comments = ({ postId, authorId }) => {
  const [comments, setComments] = useState<IComments.Comment[]>()
  const [commentsSliceEnd, setCommentsSliceEnd] = useState<number>(
    MIN_COMMENTS_SLICE
  )
  const [isLoadingNewComments, setIsLoadingNewComments] = useState<boolean>(
    true
  )
  const [commentsLength, setCommentsLength] = useState<number>()
  const [fetchError, setError] = useState()
  const classes = useStyles()
  const commentsEndRef = useRef()

  const onScroll = useCallback(() => {
    if (commentsSliceEnd >= commentsLength) {
      if (isLoadingNewComments) setIsLoadingNewComments(false)
      return
    }

    if (isInViewport(commentsEndRef, SCROLL_OFFSET) && !isLoadingNewComments) {
      setCommentsSliceEnd((prev) => prev + MIN_COMMENTS_SLICE)
      setIsLoadingNewComments(true)
    } else {
      if (isLoadingNewComments) setIsLoadingNewComments(false)
    }
  }, [commentsSliceEnd, isLoadingNewComments, commentsLength])

  const flatten = useCallback((nodes, a = []) => {
    for (let i = 0; i < nodes.length; i++) {
      a.push(nodes[i])
      flatten(nodes[i].children, a)
    }
    return a
  }, [])

  useEffect(() => {
    const parseComments = (nodes: Map<number, IComments.Comment>) => {
      const root = []
      for (const id in nodes) {
        const comment = nodes[id]
        comment.children = []

        const parent = comment.parentId !== 0 ? nodes[comment.parentId] : null

        if (!parent) {
          root.push(comment)
        } else {
          parent.children.push(comment)
        }
      }

      return root
    }

    window.addEventListener('scroll', onScroll)

    const get = async () => {
      // Reset error state
      setError(null)

      try {
        const d = await getComments(postId)
        const commentsData = d.data.comments
        const parsedComments = parseComments(commentsData)
        const flat = flatten(parsedComments)

        setCommentsLength(Object.keys(commentsData).length)
        setComments(flat.map((x: IComments.Comment) => delete x.children && x))
      } catch (e) {
        return setError(e.message)
      }
    }
    get()

    return () => window.removeEventListener('scroll', onScroll)
  }, [postId, onScroll, flatten])

  if (fetchError) return <p>error {fetchError}</p>

  return (
    <div className={classes.root}>
      <Container className={classes.headerContainer}>
        <Typography className={classes.header}>
          Комментарии&nbsp;
          {commentsLength && (
            <Fade in={commentsLength !== 0}>
              <span className={classes.commentsNumber}>{commentsLength}</span>
            </Fade>
          )}
        </Typography>
      </Container>
      <Container className={classes.comments}>
        {comments &&
          comments
            .slice(0, commentsSliceEnd)
            .map((node) => (
              <Comment
                key={node.id}
                data={node}
                isAuthor={node.author ? authorId === node.author.id : false}
              />
            ))}
        {(!comments || isLoadingNewComments) && (
          <LinearProgress className={classes.progress} />
        )}
        <div ref={commentsEndRef} />
      </Container>
    </div>
  )
}

export default Comments