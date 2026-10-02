import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
function mockFetch(auth=false) {
  global.fetch = jest.fn(async (url) => {
    let data = {};
    if (url.endsWith('/session')) data = auth ? {userName:'demo',firstName:'Demo',status:'Authenticated'} : {userName:'',status:'Anonymous'};
    else if (url.endsWith('/get_dealers')) data = {dealers:[{id:1,full_name:'Kansas Motors',state:'Kansas',city:'Wichita'},{id:2,full_name:'Texas Motors',state:'Texas',city:'Austin'}]};
    return {ok:true,json:async()=>data};
  });
}
function page(path) { return render(<MemoryRouter initialEntries={[path]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App /></MemoryRouter>); }
afterEach(()=>jest.restoreAllMocks());
test('anonymous directory filters Kansas then returns all',async()=>{
 mockFetch(); page('/dealers'); await screen.findByText('Kansas Motors');
 expect(screen.queryByText('Review Dealer')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filter by state'),{target:{value:'Kansas'}});
 expect(screen.queryByText('Texas Motors')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Filter by state'),{target:{value:'All'}});
 expect(screen.getByText('Texas Motors')).toBeInTheDocument();
});
test('authenticated directory shows review actions',async()=>{
 mockFetch(true); page('/dealers'); await screen.findByText('Review Dealer');
 expect(screen.getAllByText('Write a review ↗')).toHaveLength(2);
});
test('register has six fields and blocks mismatched passwords',async()=>{
 mockFetch(); page('/register'); await waitFor(()=>expect(screen.getByRole('button',{name:'Register'})).toBeEnabled());
 ['Username','First name','Last name','Email','Password','Confirm password'].forEach(label=>expect(screen.getByLabelText(label)).toBeInTheDocument());
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'Strong-pass-918!'}});
 fireEvent.change(screen.getByLabelText('Confirm password'),{target:{value:'Other-pass-918!'}});
 fireEvent.submit(screen.getByRole('button',{name:'Register'}).closest('form'));
 expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
 expect(global.fetch.mock.calls.some(([url])=>url.endsWith('/register'))).toBe(false);
});
test('login Cancel returns to directory',async()=>{
 mockFetch(); page('/login'); fireEvent.click(screen.getByRole('link',{name:'Cancel'}));
 await screen.findByText('Kansas Motors');
});
test('direct anonymous review route returns to login',async()=>{
 mockFetch(); page('/postreview/1'); await screen.findByRole('heading',{name:'Login'});
});
