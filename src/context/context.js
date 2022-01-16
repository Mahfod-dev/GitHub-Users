import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
	const [githubUser, setGitHubUsers] = useState(mockUser)
	const [repos, setRepos] = useState(mockRepos)
	const [followers, setFollowers] = useState(mockFollowers)

	const [requests, setRequests] = useState(0)

	const [isLoading, setIsLoading] = useState(false)

	const [error, setError] = useState({ show: false, msg: '' })

	const searchGitHubUsers = async (user) => {
		toogleError()
		setIsLoading(true)
		const response = await axios
			.get(`${rootUrl}/users/${user}`)
			.catch((error) => console.log(error))
		if (response) {
			setGitHubUsers(response.data)

			const { login, followers_url } = response.data

			await Promise.allSettled([
				axios.get(`${rootUrl}/users/${login}/repos?per_page=100`),
				axios.get(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					const [repos, followers] = results
					const status = 'fulfilled'
					if (repos.status === status) {
						setRepos(repos.value.data)
					}
					if (followers.status === status) {
						setFollowers(followers.value.data)
					}
				})
				.catch((err) => console.error(err))
		} else {
			toogleError(true, 'there is no user with that usename')
		}
		checkRequests()
		setIsLoading(false)
	}

	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data

				setRequests(remaining)

				if (remaining === 0) {
					toogleError(true, "Sorry you have exceeded your limit's rate")
				}
			})
			.catch((error) => {
				console.log(error)
			})
	}

	function toogleError(show = false, msg = '') {
		setError({ show, msg })
	}

	useEffect(checkRequests, [])

	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				requests,
				error,
				searchGitHubUsers,
				isLoading,
			}}>
			{children}
		</GithubContext.Provider>
	)
}

export { GithubContext, GithubProvider }
